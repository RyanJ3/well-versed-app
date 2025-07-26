#!/usr/bin/env python3
"""
Generate password hashes for test users
Run this to create new password hashes if needed
"""
import hashlib
import secrets


def hash_password(password: str, salt: str = None) -> str:
    """Hash password with PBKDF2-SHA256"""
    if salt is None:
        salt = secrets.token_hex(8)  # 16 character hex string

    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # iterations
    )

    return f"{salt}${pwd_hash.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash"""
    try:
        salt, hash_hex = password_hash.split('$')
        test_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return test_hash.hex() == hash_hex
    except:
        return False


if __name__ == "__main__":
    # Generate hash for test password
    test_password = "Test123!"
    test_salt = "a1b2c3d4e5f6g7h8"

    hash_result = hash_password(test_password, test_salt)
    print(f"Password: {test_password}")
    print(f"Salt: {test_salt}")
    print(f"Hash: {hash_result}")
    print(f"\nVerification test: {verify_password(test_password, hash_result)}")

    # Test with wrong password
    print(f"Wrong password test: {verify_password('Wrong123!', hash_result)}")
