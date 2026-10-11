// Deliberately awkward but functioning CLI to review, not a suggested interface.
const [command, value]=process.argv.slice(2);
if(command==='help')console.log('Commands: config-x, init-y, run-z, state. You must remember IDs between commands.');
else if(command==='config-x')console.log('Created configuration ID cfg-123. Copy it.');
else if(command==='init-y'&&value)console.log('Created work ID work-234. Copy it and retain cfg-123 separately.');
else if(command==='run-z'&&value)console.log('OK. Use state <work-id> to find out whether it finished.');
else if(command==='state'&&value)console.log('state=4');
else {console.error('E_BAD_INPUT');process.exitCode=1;}
