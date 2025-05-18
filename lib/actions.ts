export async function addSensorData(data: { temperature: number; humidity: number }) {
  "use server"
  console.log("Adding sensor data (simulated):", data)
  // In a real implementation, you would save the data to a database here.
  return { success: true }
}
