import {spawn} from 'node:child_process';
import {StringDecoder} from 'node:string_decoder';

const DIALOGS = new Set(['select', 'confirm', 'input', 'editor']);
const MAX_LINE_BYTES = 16 * 1024 * 1024;
const errorOf = value => value instanceof Error ? value : new Error(String(value));
const abortError = () => Object.assign(new Error('Delegated work cancelled'), {name:'AbortError'});

/** A small client for one PiG RPC process and one active prompt.
 * args are literal argv, without --mode; the client adds --mode rpc.
 * onDialog must return an extension_ui_response payload. With no handler,
 * dialogs are cancelled and reported in unansweredInputs; notices are harmless.
 */
export class RpcClient {
  constructor({command, args=[], cwd, env={}, onEvent, onDialog, timeoutMs=30000}) {
    if (typeof command !== 'string' || !command.trim()) throw new Error('RPC command is required');
    if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('RPC args must be strings');
    if (args.some(arg => arg === '--mode' || arg.startsWith('--mode='))) throw new Error('RPC args must omit --mode; the client selects rpc');
    if (!env || Array.isArray(env) || typeof env !== 'object' || Object.values(env).some(value => typeof value !== 'string')) throw new Error('RPC env values must be strings');
    this.options = {command,args,cwd,env,timeoutMs};
    this.observer = onEvent;
    this.onDialog = onDialog;
    this.pending = new Map();
    this.listeners = new Set();
    this.failureListeners = new Set();
    this.dialogs = new Set();
    this.lifetime = new AbortController();
    this.stderr = '';
    this.sequence = 0;
  }

  async start() {
    if (this.child || this.closing) throw new Error('RPC client already started or closed');
    const {command,args,cwd,env} = this.options;
    this.child = spawn(command, [...args,'--mode','rpc'], {
      cwd, env:{...process.env,...env}, shell:false, detached:process.platform !== 'win32', stdio:['pipe','pipe','pipe'],
    });
    this.exited = new Promise(resolve => this.child.once('close', (code,signal) => {
      this.exit = {code,signal};
      if (!this.closing) this.fail(new Error(`Agent exited (${signal ?? code})${this.stderr ? `: ${this.stderr.trim()}` : ''}`));
      resolve();
    }));
    this.child.on('error', error => this.fail(error));
    this.child.stdin.on('error', error => { if (!this.closing) this.fail(error); });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', chunk => { this.stderr = (this.stderr + chunk).slice(-16384); });
    const decoder = new StringDecoder('utf8');
    let buffered = '';
    const consume = chunk => {
      buffered += chunk;
      let newline;
      while ((newline = buffered.indexOf('\n')) !== -1) {
        const line = buffered.slice(0,newline).replace(/\r$/, '');
        buffered = buffered.slice(newline+1);
        if (Buffer.byteLength(line) > MAX_LINE_BYTES) return this.fail(new Error('RPC output record exceeds 16 MiB'));
        if (line.trim()) {
          try { this.receive(JSON.parse(line)); }
          catch (error) { return this.fail(new Error(`Invalid RPC output: ${error.message}`)); }
        }
      }
      if (Buffer.byteLength(buffered) > MAX_LINE_BYTES) this.fail(new Error('RPC output record exceeds 16 MiB'));
    };
    this.child.stdout.on('data', chunk => consume(decoder.write(chunk)));
    this.child.stdout.on('end', () => {
      consume(decoder.end());
      if (buffered.trim() && !this.closing) this.fail(new Error('RPC output ended inside a JSONL record'));
    });
    await new Promise((resolve,reject) => {
      this.child.once('spawn',resolve);
      this.child.once('error',reject);
    });
    return this;
  }

  receive(event) {
    if (!event || typeof event !== 'object' || typeof event.type !== 'string') throw new Error('Expected an event object with a type');
    if (event.type === 'response' && this.pending.has(event.id)) {
      const request = this.pending.get(event.id);
      if (event.success === true) request.resolve(event.data);
      else request.reject(new Error(event.error || `RPC ${event.command} failed`));
      return;
    }
    for (const listener of this.listeners) this.call(listener,event);
    this.call(this.observer,event);
    if (event.type === 'extension_ui_request' && DIALOGS.has(event.method)) void this.answerDialog(event);
  }

  call(callback,...args) {
    if (!callback) return;
    try {
      const result = callback(...args);
      if (result?.then) result.catch(error => this.fail(error));
    } catch (error) { this.fail(error); }
  }

  async answerDialog(request) {
    if (typeof request.id !== 'string' || this.dialogs.has(request.id)) return this.fail(new Error('Invalid or repeated RPC dialog id'));
    this.dialogs.add(request.id);
    try {
      const answer = this.onDialog ? await this.onDialog(request,{signal:this.lifetime.signal}) : {cancelled:true};
      if (!this.closing) this.write({...(answer ?? {cancelled:true}),type:'extension_ui_response',id:request.id});
    } catch (error) {
      if (!this.closing) {
        this.write({type:'extension_ui_response',id:request.id,cancelled:true});
        this.fail(error);
      }
    } finally { this.dialogs.delete(request.id); }
  }

  write(record, onError) {
    if (this.failure || this.closing || !this.child?.stdin.writable) throw this.failure ?? new Error('RPC client is not running');
    this.child.stdin.write(JSON.stringify(record)+'\n', error => { if (error) (onError ?? (e => this.fail(e)))(error); });
  }

  request(type, fields={}, {signal,timeoutMs=this.options.timeoutMs}={}) {
    if (signal?.aborted) return Promise.reject(signal.reason ?? abortError());
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return Promise.reject(new Error('RPC timeout must be positive'));
    return new Promise((resolve,reject) => {
      const id = `request-${++this.sequence}`;
      let timer;
      const finish = (callback,value) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort',aborted);
        this.pending.delete(id);
        callback(value);
      };
      const aborted = () => finish(reject,signal.reason ?? abortError());
      const pending = {resolve:value => finish(resolve,value),reject:error => finish(reject,error)};
      this.pending.set(id,pending);
      timer = setTimeout(() => pending.reject(new Error(`RPC ${type} timed out`)),timeoutMs);
      signal?.addEventListener('abort',aborted,{once:true});
      try { this.write({...fields,type,id},pending.reject); }
      catch (error) { pending.reject(error); }
    });
  }

  async prompt(message,{signal,timeoutMs=300000,onUpdate,images,streamingBehavior}={}) {
    if (this.activePrompt) throw new Error('One prompt at a time per RPC client; use another instance for parallel work');
    if (typeof message !== 'string' || !message.trim()) throw new Error('Prompt must be nonempty');
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Prompt timeout must be positive');
    if (signal?.aborted) throw signal.reason ?? abortError();
    this.activePrompt = true;
    const run = new AbortController();
    let resolveSettled, rejectSettled, lastAssistant, streamed = '';
    const unansweredInputs = [];
    const settled = new Promise((resolve,reject) => { resolveSettled=resolve; rejectSettled=reject; });
    // A process can fail while the command acknowledgement is still pending.
    settled.catch(() => {});
    const stop = reason => { run.abort(reason); rejectSettled(reason); };
    const aborted = () => stop(signal.reason ?? abortError());
    const timer = setTimeout(() => stop(new Error('Delegated prompt timed out')),timeoutMs);
    signal?.addEventListener('abort',aborted,{once:true});
    const failed = error => { rejectSettled(error); };
    const observe = event => {
      if (event.type === 'message_update' && event.assistantMessageEvent?.type === 'text_delta') {
        streamed += event.assistantMessageEvent.delta ?? '';
        this.call(onUpdate,streamed,event);
      }
      if (event.type === 'message_end' && event.message?.role === 'assistant') lastAssistant=event.message;
      if (event.type === 'error') stop(new Error(event.message ?? event.error ?? 'Agent reported an error'));
      if (event.type === 'extension_ui_request' && DIALOGS.has(event.method) && !this.onDialog) unansweredInputs.push({method:event.method,title:event.title});
      if (event.type === 'agent_settled') {
        if (event.aborted || ['error','aborted'].includes(lastAssistant?.stopReason)) stop(new Error(lastAssistant?.errorMessage ?? 'Agent run failed or was aborted'));
        else resolveSettled();
      }
    };
    // Subscribe before sending; even a very short turn cannot outrun collection.
    this.listeners.add(observe);
    this.failureListeners.add(failed);
    try {
      // A first launch may install the app before reading stdin. Its prompt
      // acknowledgement shares the caller's deadline, not the short control timeout.
      const response = await this.request('prompt',{message,...(images?{images}:{}),...(streamingBehavior?{streamingBehavior}:{})},{signal:run.signal,timeoutMs});
      const disposition = response?.disposition;
      if (!['started','queued','handled'].includes(disposition)) throw new Error('Agent returned an unsupported prompt disposition');
      if (disposition !== 'handled') await settled;
      const session = await this.request('get_state',{}, {signal:run.signal});
      const final = disposition === 'handled' ? null : await this.request('get_last_assistant_text',{}, {signal:run.signal});
      return {disposition,text:final?.text ?? '',session,...(unansweredInputs.length?{unansweredInputs}:{})};
    } catch (error) {
      // The caller must not inherit a still-running child after timeout/cancellation.
      if (!this.failure && !this.closing) await this.abort().catch(() => {});
      await this.close();
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort',aborted);
      this.listeners.delete(observe);
      this.failureListeners.delete(failed);
      this.activePrompt = false;
    }
  }

  abort() { return this.request('abort',{}, {timeoutMs:1500}); }

  kill(signal) {
    try {
      if (process.platform !== 'win32' && this.child.pid) process.kill(-this.child.pid,signal);
      else this.child.kill(signal);
    } catch (error) { if (error.code !== 'ESRCH') this.child.kill(signal); }
  }

  fail(error) {
    if (this.failure) return;
    this.failure=errorOf(error);
    for (const request of this.pending.values()) request.reject(this.failure);
    for (const listener of this.failureListeners) listener(this.failure);
    void this.close();
  }

  async close() {
    if (this.closePromise) return this.closePromise;
    this.closing = true;
    this.lifetime.abort();
    const error = this.failure ?? new Error('RPC client closed');
    for (const request of this.pending.values()) request.reject(error);
    for (const listener of this.failureListeners) listener(error);
    this.closePromise = (async() => {
      if (!this.child || this.exit) return;
      this.child.stdin.end();
      const wait = ms => new Promise(resolve => {
        const timer=setTimeout(resolve,ms);
        this.exited.then(() => { clearTimeout(timer); resolve(); });
      });
      await wait(1000);
      if (!this.exit) { this.kill('SIGTERM'); await wait(1000); }
      if (!this.exit) { this.kill('SIGKILL'); await this.exited; }
    })();
    return this.closePromise;
  }
}
