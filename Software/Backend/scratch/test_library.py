import requests
import os

API_URL = "http://localhost:8000"

def run_tests():
    # 1. Obtener Token de Autenticación
    print("Iniciando sesión...")
    auth_res = requests.post(
        f"{API_URL}/auth/login",
        data={"username": "pipeanayaparada@gmail.com", "password": "password123"}
    )
    if auth_res.status_code != 200:
        print(f"Fallo al iniciar sesión ({auth_res.status_code}): {auth_res.text}")
        return
        
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Crear un archivo PDF dummy para la prueba
    pdf_path = "test_documento_eafit.pdf"
    with open(pdf_path, "w") as f:
        f.write("%PDF-1.5 prueba de contenido academico de circuitos electricos eafit")
        
    print(f"Archivo dummy creado en: {pdf_path}")
    
    try:
        # 3. Subir archivo mediante POST /library/upload
        print("Subiendo archivo a la Librería Global...")
        with open(pdf_path, "rb") as f:
            files = {"file": (pdf_path, f, "application/pdf")}
            data = {
                "title": "Fundamentos de Circuitos de Mallas",
                "category": "PDFs",
                "difficulty": "Principiante"
            }
            res_upload = requests.post(f"{API_URL}/library/upload", headers=headers, data=data, files=files)
            
        if res_upload.status_code != 200:
            print(f"Fallo subida: {res_upload.text}")
            return
            
        material = res_upload.json()
        material_id = material["id"]
        print(f"Subido con éxito. ID asignado: {material_id}")
        
        # 4. Obtener Lista de la Biblioteca con GET /library
        print("Obteniendo lista de material global...")
        res_list = requests.get(f"{API_URL}/library", headers=headers)
        if res_list.status_code == 200:
            materials = res_list.json()
            titles = [m["title"] for m in materials]
            print(f"Materiales registrados en DB: {titles}")
            
        # 5. Descargar archivo con GET /library/download/{id}
        print("Descargando archivo...")
        res_download = requests.get(f"{API_URL}/library/download/{material_id}", headers=headers)
        if res_download.status_code == 200:
            print(f"Descargado con éxito. Bytes leídos: {len(res_download.content)}")
            
        # 6. Eliminar el archivo con DELETE /library/{id}
        print("Eliminando material de prueba...")
        res_del = requests.delete(f"{API_URL}/library/{material_id}", headers=headers)
        if res_del.status_code == 204:
            print("Material eliminado y limpiado del servidor correctamente.")
            
    finally:
        # Limpieza local
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            
if __name__ == "__main__":
    run_tests()
