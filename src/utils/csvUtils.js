export const parseCsv = (csvText) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',')
  const result = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',')
    const obj = {}

    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || ''
    })

    // Use name_en as id
    obj.id = obj.name_en

    result.push(obj)
  }

  return result
};
