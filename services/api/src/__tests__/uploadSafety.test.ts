import { studentUploadSafetyValidator } from '../shared/uploadSafety.validator';

describe('Student Upload Safety & Sanitization', () => {
  it('prevents path traversal attacks and generates UUID filenames', () => {
    const maliciousName = '../../../../etc/passwd.png';
    const result = studentUploadSafetyValidator.sanitizeAndGenerateFilename(maliciousName);

    expect(result.safeName).not.toContain('..');
    expect(result.safeName).not.toContain('etc');
    expect(result.extension).toBe('.png');
  });

  it('rejects disallowed file extensions', () => {
    expect(() => {
      studentUploadSafetyValidator.sanitizeAndGenerateFilename('malicious_script.sh');
    }).toThrow('INVALID_FILE_EXTENSION');
  });

  it('verifies magic bytes for PNG files', () => {
    // Valid PNG Magic Header: 0x89 0x50 0x4E 0x47
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => {
      studentUploadSafetyValidator.validateFileBuffer(validPngBuffer, 'image/png');
    }).not.toThrow();
  });

  it('rejects spoofed file buffers matching wrong magic bytes', () => {
    const fakePngBuffer = Buffer.from('console.log("spoofed file")', 'utf-8');
    expect(() => {
      studentUploadSafetyValidator.validateFileBuffer(fakePngBuffer, 'image/png');
    }).toThrow('CORRUPTED_OR_MALICIOUS_FILE');
  });

  it('rejects files exceeding 5 MB limit', () => {
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    expect(() => {
      studentUploadSafetyValidator.validateFileBuffer(oversizedBuffer, 'application/pdf');
    }).toThrow('FILE_TOO_LARGE');
  });
});
