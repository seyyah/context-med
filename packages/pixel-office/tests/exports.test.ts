import { describe, test, expect } from 'vitest';
import * as PixelOffice from '../src/index';

describe('Pixel Office Package Export Tests', () => {
  test('Package should export ContextMedShell', () => {
    expect(PixelOffice.ContextMedShell).toBeDefined();
    expect(typeof PixelOffice.ContextMedShell).toBe('function');
  });

  test('Package should export RetroOffice3D', () => {
    expect(PixelOffice.RetroOffice3D).toBeDefined();
    expect(typeof PixelOffice.RetroOffice3D).toBe('function');
  });
});
