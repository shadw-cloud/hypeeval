// Import the 'eval.js' module
const ev = require('./eval.js')

// Define an asynchronous function 'runCall' with parameters
const runCall = async (index, calls, input = {}, pk, ipcCall, refresh) => {
  console.log('run call')

  // Get the call at the specified index
  const call = calls[index]

  // Initialize stdout and stderr for the call
  call.stdout = ''
  call.stderr = ''

  console.log('calling before')

  // Execute code before the main call using 'eval'
  const before = (await ev(`const console = {log:(...params)=>{api('log', JSON.stringify(params))}}; let params = ${JSON.stringify(input)};${call.before};params`))
  
  console.log({before})

  // Append 'before' stdout to the call's stdout
  call.stdout += before.stdout || ''

  // Invoke the main call using 'ipcCall'
  const out = await ipcCall(pk, call.name, before.value)

  // Append 'out' stdout and stderr to the call's respective properties
  call.stdout += out.stdout || ''
  call.stderr += out.stderr || ''

  // Remove 'stdout' and 'stderr' properties from 'out' to avoid duplication
  delete out.stdout
  delete out.stderr

  // Execute code after the main call using 'eval'
  const after = (await ev(`const console = {log:(...params)=>{api('log', JSON.stringify(params))}}; let out = ${JSON.stringify(out)};${call.after};out`))

  // Extract the result from 'after' and assign it to 'afterOut'
  const afterOut = after.value

  // Append 'after' stdout to the call's stdout
  call.stdout += after.stdout || ''

  // Convert 'afterOut' to a nicely formatted JSON string and assign it to 'call.result'
  call.result = JSON.stringify(afterOut, null, 2)

  // Refresh the 'calls' array with the updated data
  refresh(calls)

  // If there are any 'output' items in the call, recursively run them
  if (call.output.length) {
    for (let output of call.output) {
      await runCall(output, calls, out, pk, ipcCall, refresh)
    }
  }

  // Return the updated 'calls' array
  return calls
}

// Export the 'runCall' function for use in other modules
module.exports = runCall
