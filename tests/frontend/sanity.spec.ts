/**
 * Sanity Test
 * ===========
 * Basic test to ensure the test framework is working
 */

describe('Sanity Test', () => {
  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should pass string comparison', () => {
    expect('hello').toBe('hello');
  });

  it('should pass boolean test', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
  });

  it('should pass array test', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  it('should pass object test', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });
});