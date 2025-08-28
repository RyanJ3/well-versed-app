import { TestBed } from '@angular/core/testing';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';

describe('WorkspaceParsingService', () => {
  let service: WorkspaceParsingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceParsingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractFirstLetters', () => {
    it('should extract first letters from simple words', () => {
      expect(service.extractFirstLetters('Hello world')).toBe('H w');
    });

    it('should handle empty string', () => {
      expect(service.extractFirstLetters('')).toBe('');
    });

    it('should preserve punctuation', () => {
      expect(service.extractFirstLetters('Hello, world!')).toBe('H, w!');
    });

    it('should handle contractions', () => {
      expect(service.extractFirstLetters("don't")).toBe('d');
      expect(service.extractFirstLetters("can't")).toBe('c');
      expect(service.extractFirstLetters("won't")).toBe('w');
      expect(service.extractFirstLetters("I'm")).toBe('I');
      expect(service.extractFirstLetters("they're")).toBe('t');
      expect(service.extractFirstLetters("we've")).toBe('w');
      expect(service.extractFirstLetters("I'll")).toBe('I');
      expect(service.extractFirstLetters("he'd")).toBe('h');
    });

    it('should preserve possessive apostrophes', () => {
      expect(service.extractFirstLetters("God's")).toBe("G's");
      expect(service.extractFirstLetters("cat's")).toBe("c's");
      expect(service.extractFirstLetters("James'")).toBe("J'");
    });

    it('should handle possessives', () => {
      expect(service.extractFirstLetters("John's")).toBe("J's");
      expect(service.extractFirstLetters("Jesus'")).toBe("J'");
      expect(service.extractFirstLetters("children's")).toBe("c's");
    });

    it('should handle complex sentences', () => {
      const input = "Don't worry, I'm sure it's John's book.";
      const expected = "D w, I s i's J's b.";
      expect(service.extractFirstLetters(input)).toBe(expected);
    });

    it('should handle words without letters', () => {
      expect(service.extractFirstLetters('123 456')).toBe('123 456');
    });

  });

  describe('getMemoryModeDisplay', () => {
    it('should return dots for each word', () => {
      expect(service.getMemoryModeDisplay('Hello world')).toBe('• •');
    });

    it('should handle empty string', () => {
      expect(service.getMemoryModeDisplay('')).toBe('');
    });

    it('should limit dots to maxDots parameter', () => {
      const longText = 'one two three four five six seven eight nine ten eleven twelve';
      expect(service.getMemoryModeDisplay(longText, 5)).toBe('• • • • •...');
    });

    it('should use default maxDots of 10', () => {
      const longText = 'one two three four five six seven eight nine ten eleven twelve';
      expect(service.getMemoryModeDisplay(longText)).toBe('• • • • • • • • • •...');
    });

    it('should not add ellipsis for text within limit', () => {
      expect(service.getMemoryModeDisplay('one two three')).toBe('• • •');
    });
  });
});