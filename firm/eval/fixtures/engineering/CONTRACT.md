# Order contract — evaluation ground truth
A confirmed order has a nonempty SKU, positive integer quantity, enough stock and a nonnegative finite unit price. Total equals quantity × unit price. stockAfter equals stock − quantity and is never negative. Invalid input must not result in a confirmed order. Cancellation and persistence are out of scope for this tiny fixture.
User concerns: expected inputs/outputs, a flow that completes, and regression protection. Do not measure success by test count or exported helper names.
