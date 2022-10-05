import { describe, it } from 'mocha';
import { expect } from 'chai';
import './dompoint.js';

import { SnapPoint } from '../js/board.js';

describe('SnapPoint', () => {
  it('should be created with the correct column and row', () => {
    const snap1 = new SnapPoint(0, 0, 0);
    expect(snap1.col).to.equal(1);
    expect(snap1.row).to.equal('a');

    const snap2 = new SnapPoint(1, 0, 0);
    expect(snap2.col).to.equal(2);
    expect(snap2.row).to.equal('a');

    const snap3 = new SnapPoint(0, 1, 0);
    expect(snap3.col).to.equal(1);
    expect(snap3.row).to.equal('b');

    const snap4 = new SnapPoint(1, 1, 0);
    expect(snap4.col).to.equal(2);
    expect(snap4.row).to.equal('b');

    const snap5 = new SnapPoint(2, 3, 0);
    expect(snap5.col).to.equal(3);
    expect(snap5.row).to.equal('d');

    const snap6 = SnapPoint.fromId('[3,"d",0]');
    expect(snap6.col).to.equal(3);
    expect(snap6.row).to.equal('d');
  });

  describe('toId()', () => {
    it('should output the correct ID', () => {
      const snap = SnapPoint.fromId('[3,"d",0]');
      expect(snap.toId()).to.equal('[3,"d",0]');
    });
  });

  describe('colNum()', () => {
    it('should be zero-based', () => {
      const snap = SnapPoint.fromId('[3,"d",0]');
      expect(snap.colNum()).to.equal(2);
    });
  });

  describe('rowNum()', () => {
    it('should be zero-based', () => {
      const snap = SnapPoint.fromId('[3,"d",0]');
      expect(snap.rowNum()).to.equal(3);
    });
  });
});
