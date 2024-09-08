export class Queue<T> {
  private head = 0;
  private tail = 0;
  private elements: {
    [key: string]: T;
  } = {};

  constructor() {}

  push(element: T) {
    this.tail += 1;
    this.elements[`${this.tail}`] = element;
  }

  pop() {
    const retVal = this.elements[`${this.head}`];
    this.head += 1;
    return retVal;
  }

  get length() {
    return this.tail - this.head;
  }

  get isEmpty() {
    return this.length === 0;
  }
}
