// Ported from below

/**
 * @overview idle-bignum.
 * @copyright 2019 Frederic 경진 Rezeau
 * @license [MIT]{@link https://github.com/FredericRezeau/idle-bignum/blob/master/LICENSE}
 */

const IdleGameExponents = ["", "K", "M", "B", "T"];
const AMOUNT_OF_LETTERS_IN_ALPHABET = 26;
const A_CharCode = 65;

const MAX_MAGNITUDE = 12; // Max power magnitude diff for operands.
const TEN_CUBED = 1e3; // Used for normalizing numbers.

// Big number.
export class BigNumber {
  private value: number;
  private exp: number;
  public negative: boolean;

  serialize() {
    return JSON.stringify({
      value: this.value,
      exp: this.exp,
      negative: this.negative,
    });
  }

  static from(value: number | BigNumber) {
    if (value instanceof BigNumber) {
      return new BigNumber(value.value, value.exp, value.negative);
    }
    const bn = new BigNumber(value);
    return bn.normalize();
  }

  constructor(value: number, exp?: number, negative?: boolean) {
    this.negative = negative || (value < 0);
    this.value = value;
    this.exp = exp ? exp : 0;
    this.normalize();
  }

  // Debug whats wrong with visualization
  // Normalize a number (Engineering notation).
  normalize() {
    if (this.value < 0) {
      // Negative flag is set but negative number operations are not supported.
      this.negative = this.value < 0 ? true : false;
      this.exp = 0;
      this.value = Math.abs(this.value);
    }

    while (this.value < 1 && this.exp !== 0) {
      // e.g. 0.1E6 is converted to 100E3 ([0.1, 6] = [100, 3])
      this.value *= TEN_CUBED;
      this.exp -= 3;
    }
    // e.g. 10000E3 is converted to 10E6 ([10000, 3] = [10, 6])
    while (this.value >= TEN_CUBED) {
      this.value *= 1 / TEN_CUBED;
      this.exp += 3;
    }

    return this;
  }

  // Compute the equivalent number at 1.Eexp (note: assumes exp is greater than this.exp).
  align(exp: number) {
    const d = exp - this.exp;
    if (d > 0) {
      this.value = (d <= MAX_MAGNITUDE) ? this.value / Math.pow(10, d) : 0;
      this.exp = exp;
    }
  }

  // Add a number to this number.
  add(bigNum: BigNumber) {
    if (bigNum.exp < this.exp) {
      bigNum.align(this.exp);
    } else {
      this.align(bigNum.exp);
    }
    this.value += bigNum.value;
    this.normalize();
    bigNum.normalize();
  }

  // Subtract a number from this number.
  substract(bigNum: BigNumber) {
    if (bigNum.exp < this.exp) {
      bigNum.align(this.exp);
    } else {
      this.align(bigNum.exp);
    }
    this.value -= bigNum.value;
    this.normalize();
    bigNum.normalize();
  }

  // Multiply this number by factor.
  multiply(factor: number) {
    // We do not support negative numbers.
    if (factor >= 0) {
      this.value *= factor;
      this.normalize();
    }
  }

  // Divide this number by divisor.
  divide(divisor: number) {
    if (divisor > 0) {
      this.value /= divisor;
      this.normalize();
    }
  }

  // getValue. Return the number value as string.
  getValue(precision?: number) {
    return Number(this.value.toFixed(precision ? precision : 2)).toString();
  }

  // getExpName. Return the exponent name as string.
  getExpName() {
    let unit = "";
    const magnitude = this.exp / 3;

    if (magnitude < IdleGameExponents.length) {
      unit = IdleGameExponents[magnitude];
    } else {
      const unitInt = magnitude - IdleGameExponents.length;
      const firstUnit = A_CharCode + unitInt / AMOUNT_OF_LETTERS_IN_ALPHABET;
      const secondUnit = A_CharCode + unitInt % AMOUNT_OF_LETTERS_IN_ALPHABET;

      unit = String.fromCharCode(firstUnit, secondUnit);
    }

    return unit;
  }

  // getExp. Return the exponent as string.
  getExp() {
    return this.exp.toString();
  }

  // toString.
  toString() {
    return this.getValue() + " " + this.getExpName();
  }

  isZero() {
    return this.value === 0 && this.exp === 0;
  }
}
