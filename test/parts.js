import { describe, it } from 'mocha';
import { expect } from 'chai';

import { High, Low, Inverter, Nand, Nor, Xnor, And, Or, Xor, Switch } from '../js/parts.js';

describe('Part', () => {
  describe('High', () => {
    it('should output 1', () => {
      const part = new High();
      expect(part.output()).to.equal(1);
    });
  });

  describe('Low', () => {
    it('should output 0', () => {
      const part = new Low();
      expect(part.output()).to.equal(0);
    });
  });

  describe('Inverter', () => {
    it('should output 0 for High', () => {
      const part = new Inverter(new High());
      expect(part.output()).to.equal(0);
    });

    it('should output 1 for Low', () => {
      const part = new Inverter(new Low());
      expect(part.output()).to.equal(1);
    });
  });

  describe('Nand', () => {
    it('should output 1 for Low !& Low', () => {
      const part = new Nand(new Low(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 1 for Low !& High', () => {
      const part = new Nand(new Low(), new High());
      expect(part.output()).to.equal(1);
    });

    it('should output 1 for High !& Low', () => {
      const part = new Nand(new High(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 0 for High !& High', () => {
      const part = new Nand(new High(), new High());
      expect(part.output()).to.equal(0);
    });
  });

  describe('Nor', () => {
    it('should output 1 for Low !| Low', () => {
      const part = new Nor(new Low(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 0 for Low !| High', () => {
      const part = new Nor(new Low(), new High());
      expect(part.output()).to.equal(0);
    });

    it('should output 0 for High !| Low', () => {
      const part = new Nor(new High(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 0 for High !| High', () => {
      const part = new Nor(new High(), new High());
      expect(part.output()).to.equal(0);
    });
  });

  describe('Xnor', () => {
    it('should output 1 for Low !^ Low', () => {
      const part = new Xnor(new Low(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 0 for Low !^ High', () => {
      const part = new Xnor(new Low(), new High());
      expect(part.output()).to.equal(0);
    });

    it('should output 0 for High !^ Low', () => {
      const part = new Xnor(new High(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 1 for High !^ High', () => {
      const part = new Xnor(new High(), new High());
      expect(part.output()).to.equal(1);
    });
  });

  describe('And', () => {
    it('should output 0 for Low & Low', () => {
      const part = new And(new Low(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 0 for Low & High', () => {
      const part = new And(new Low(), new High());
      expect(part.output()).to.equal(0);
    });

    it('should output 0 for High & Low', () => {
      const part = new And(new High(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 1 for High & High', () => {
      const part = new And(new High(), new High());
      expect(part.output()).to.equal(1);
    });
  });

  describe('Or', () => {
    it('should output 0 for Low | Low', () => {
      const part = new Or(new Low(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 1 for Low | High', () => {
      const part = new Or(new Low(), new High());
      expect(part.output()).to.equal(1);
    });

    it('should output 1 for High | Low', () => {
      const part = new Or(new High(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 1 for High | High', () => {
      const part = new Or(new High(), new High());
      expect(part.output()).to.equal(1);
    });
  });

  describe('Xor', () => {
    it('should output 0 for Low ^ Low', () => {
      const part = new Xor(new Low(), new Low());
      expect(part.output()).to.equal(0);
    });

    it('should output 1 for Low ^ High', () => {
      const part = new Xor(new Low(), new High());
      expect(part.output()).to.equal(1);
    });

    it('should output 1 for High ^ Low', () => {
      const part = new Xor(new High(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output 0 for High ^ High', () => {
      const part = new Xor(new High(), new High());
      expect(part.output()).to.equal(0);
    });
  });

  describe('Switch', () => {
    it('should output `a` when off', () => {
      const part = new Switch(new High(), new Low());
      expect(part.output()).to.equal(1);
    });

    it('should output `b` when on', () => {
      const part = new Switch(new High(), new Low());
      part.toggle();
      expect(part.output()).to.equal(0);
    });
  });
});
