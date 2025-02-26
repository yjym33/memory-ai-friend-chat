export function fillTemplate(
  template: string,
  variables: Record<string, string[]>
) {
  return Object.entries(variables).reduce((result, [key, values]) => {
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return result.replace(`{${key}}`, randomValue);
  }, template);
}

export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
