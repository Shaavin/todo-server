/**
 * Returns a random element from the provided array.
 * @param arr - An array of elements from which to select a random element.
 * @template T - The type of elements in the array.
 * @returns A random element from the provided array.
 * @throws Will throw an error if the array is empty.
 */
export function getRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array cannot be empty");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
