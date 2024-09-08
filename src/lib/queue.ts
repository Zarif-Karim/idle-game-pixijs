export class Queue<T> {
  private head = 0;
  private tail = 0;
  private elements: {
    [key: number]: T;
  } = {};

  constructor() {}

  private reset() {
    this.head = 0;
    this.tail = 0;
    this.elements = {};
  }

  push(element: T) {
    this.elements[this.tail] = element;
    this.tail += 1;
  }

  pop() {
    if (this.isEmpty) {
      throw new Error("Queue: called pop on empty queue");
    }

    const retVal = this.elements[this.head];
    delete this.elements[this.head];
    this.head += 1;

    if (this.isEmpty) {
      // set numbers to zero to prevent exceeding upperbound
      this.reset();
    }

    return retVal;
  }

  get length() {
    return this.tail - this.head;
  }

  get isEmpty() {
    return this.length === 0;
  }
}
