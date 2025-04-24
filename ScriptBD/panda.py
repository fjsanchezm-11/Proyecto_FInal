import pandas as pd
import mysql.connector
from datetime import datetime
import mysql.connector

def create_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="practica"
    )

def clean_value(value):
    if pd.isna(value) or value in ["Ya tenía", "", "-", " ", "nan", None]:
        return None

    if isinstance(value, (int, float)):  
        return int(value)

    if isinstance(value, str):
        value = value.strip()

        if value.lower() in ['no', 'si', 'sí']:
            return 1 if value.lower() in ['si', 'sí'] else 0

        if value.isdigit():  
            return int(value)

        try:
            datetime_value = datetime.strptime(value, "%d/%m/%Y")
            return datetime_value.strftime("%Y-%m-%d")
        except ValueError:
            pass 

    return value if value != "" else None

def insert_grupos(connection, data):
    cursor = connection.cursor()

    data = data.drop_duplicates(subset=['GidNumber'])  

    for index, row in data.iterrows():
        gid = clean_value(row['GidNumber'])
        nombre_grupo = clean_value(row['Nombre del grupo'])

        if gid is None:
            print(f"⚠️ Error en fila {index}: gid_number es NULL. No se insertará.")
            continue  

        cursor.execute("SELECT 1 FROM grupos WHERE gid_number = %s", (gid,))
        if cursor.fetchone():
            print(f"⚠️ El GID {gid} ya existe en la base de datos. No se insertará.")
            continue  

        sql = "INSERT INTO grupos (gid_number, nombre) VALUES (%s, %s)"
        try:
            cursor.execute(sql, (gid, nombre_grupo))
            connection.commit()
        except mysql.connector.IntegrityError as e:
            print(f"❌ Error de integridad en fila {index} (clave duplicada): {e}\n")
            connection.rollback()

    cursor.close()

def insert_usuarios(connection, data):
    cursor = connection.cursor()

    for index, row in data.iterrows():
        try:
            gid = clean_value(row['GidNumber'])
            uid = clean_value(row['uidNumber'])

            uid = int(uid) if str(uid).isdigit() else None  

            if gid is None:
                print(f" gid_number es NULL. Se insertará el usuario sin grupo.")
            else:
                cursor.execute("SELECT 1 FROM grupos WHERE gid_number = %s", (gid,))
                if not cursor.fetchone():
                    print(f"⚠️ gid_number {gid} no existe. Se creará un nuevo grupo.")
                    cursor.execute("INSERT INTO grupos (gid_number, nombre) VALUES (%s, NULL)", (gid,))
                    connection.commit()
                    cursor.execute("SELECT 1 FROM grupos WHERE gid_number = %s", (gid,))
                    if not cursor.fetchone():
                        print(f"❌ Error crítico: No se pudo insertar el grupo con gid_number {gid}.")
                        continue

            sql = """
                INSERT INTO usuarios (
                    uid_number, nombre_usuario, fecha_alta, fecha_baja, 
                    activo, contacto, telefono, orcid, scholar, wos, 
                    scopus, res, gid_number
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                uid, 
                clean_value(row['Nombre Usuario']), 
                clean_value(row['Fecha de creación']),
                clean_value(row['Fecha de baja']),
                clean_value(row['Activo']),
                clean_value(row['Contacto']), 
                clean_value(row['Teléfono']),
                clean_value(row['ORCID']),
                clean_value(row['Scholar']),
                clean_value(row['WOS']),
                clean_value(row['Scopus']),
                clean_value(row['Usuario RES']),
                gid if gid is not None else None  
            )
            cursor.execute(sql, values)
            connection.commit()

        except Exception as e:
            print(f"❌ Error en fila {index}: {e}\n")
            connection.rollback()


def insert_proyectos(connection, data):
    cursor = connection.cursor()
    
    for index, row in data.iterrows():
        try:
            group_name = clean_value(row['Grupo Investigación'])
            gid_number = None
            
            if group_name:
                cursor.execute("SELECT gid_number FROM grupos WHERE nombre = %s", (group_name,))
                result = cursor.fetchone()
                if result:
                    gid_number = result[0]

            sql = """
                INSERT INTO proyectos (
                    titulo, fecha_inicio, fecha_fin, categoria, email, gid_number, 
                    institucion, procedencia
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                clean_value(row['Proyecto']),
                clean_value(row['Fecha de inicio']),
                clean_value(row['Fecha de fin']),
                clean_value(row['Categoría']),
                clean_value(row['Email Principal']),
                gid_number, 
                clean_value(row['Institución']),
                clean_value(row['Procedencia'])
            )
            cursor.execute(sql, values)
            connection.commit()

        except Exception as e:
            print(f"❌ Error en fila {index}: {e}\n")
            connection.rollback()

def insert_publicaciones(connection, data):
    cursor = connection.cursor()
    
    for index, row in data.iterrows():
        try:
            sql = """
                INSERT INTO publicaciones (
                    result_description, fecha_publicacion, doi
                ) 
                VALUES (%s, %s, %s)
            """ 
            values = (
                clean_value(row['Results - Description']),
                clean_value(row['Fecha publicación']),
                clean_value(row['DOI'])
            )
            cursor.execute(sql, values)
            connection.commit()

        except Exception as e:
            print(f"❌ Error en fila {index}: {e}\n")
            connection.rollback()

def insert_investigadores(connection, data):
    cursor = connection.cursor()

    for index, row in data.iterrows():
        try:
            nombre = clean_value(row['Nombre investigador'])
            correo = clean_value(row['Contacto'])  

            if not correo:
                correo = None

            sql = """
                INSERT INTO investigadores (nombre_investigador, correo)
                VALUES (%s, %s)
            """
            values = (nombre, correo)

            cursor.execute(sql, values)
            connection.commit()

        except Exception as e:
            print(f"❌ Error en fila {index}: {e}\n")
            connection.rollback()
def insert_usuarios_proyectos(connection, usuarios_data, proyectos_data):
    cursor = connection.cursor()
    
    try:
        cursor.execute("SELECT uid_number, nombre_usuario FROM usuarios WHERE nombre_usuario IS NOT NULL")
        usuario_map = {}
        for uid, nombre in cursor:
            if nombre and pd.notna(nombre):
                usuario_map[str(nombre).strip().lower()] = uid
        
        cursor.execute("SELECT pid_number, titulo FROM proyectos WHERE titulo IS NOT NULL")
        proyecto_map = {}
        for pid, titulo in cursor:
            if titulo and pd.notna(titulo):
                proyecto_map[str(titulo).strip().lower()] = pid
        
        for index, row in usuarios_data.iterrows():
            try:
                nombre_usuario = clean_value(row.get('Nombre Usuario'))
                proyecto_titulo = clean_value(row.get('Proyecto'))
                
                if not nombre_usuario or not proyecto_titulo:
                    continue
                
                nombre_usuario = str(nombre_usuario).lower()
                proyecto_titulo = str(proyecto_titulo).lower()
                
                uid_number = usuario_map.get(nombre_usuario)
                pid_number = proyecto_map.get(proyecto_titulo)
                
                if uid_number is not None and pid_number is not None:
                    cursor.execute("""
                        SELECT 1 FROM usuarios_proyectos 
                        WHERE usuario_id = %s AND proyectos_id = %s
                    """, (uid_number, pid_number))
                    
                    if not cursor.fetchone():
                        sql = """
                            INSERT INTO usuarios_proyectos (usuario_id, proyectos_id)
                            VALUES (%s, %s)
                        """
                        cursor.execute(sql, (uid_number, pid_number))
                        connection.commit()
                        
            except Exception as e:
                print(f"❌ Error en fila {index} (usuarios_proyectos): {e}")
                connection.rollback()
                
    except Exception as e:
        print(f"❌ Error general en usuarios_proyectos: {e}")
        connection.rollback()
    finally:
        cursor.close()

def insert_investigadores_usuarios(connection, usuarios_data):
    cursor = connection.cursor()
    
    try:
        cursor.execute("SELECT uid_number, nombre_usuario FROM usuarios WHERE nombre_usuario IS NOT NULL")
        usuario_map = {}
        for uid, nombre in cursor:
            if nombre and pd.notna(nombre):
                usuario_map[str(nombre).strip().lower()] = uid
        
        cursor.execute("SELECT iid_number, nombre_investigador FROM investigadores WHERE nombre_investigador IS NOT NULL")
        investigador_map = {}
        for iid, nombre in cursor:
            if nombre and pd.notna(nombre):
                investigador_map[str(nombre).strip().lower()] = iid
        
        for index, row in usuarios_data.iterrows():
            try:
                nombre_usuario = clean_value(row.get('Nombre Usuario'))
                nombre_investigador = clean_value(row.get('Nombre investigador'))
                
                if not nombre_usuario or not nombre_investigador:
                    continue
                
                nombre_usuario = str(nombre_usuario).lower()
                nombre_investigador = str(nombre_investigador).lower()
                
                uid_number = usuario_map.get(nombre_usuario)
                iid_number = investigador_map.get(nombre_investigador)
                
                if uid_number is not None and iid_number is not None:
                    cursor.execute("""
                        SELECT 1 FROM investigadores_usuarios 
                        WHERE usuario_id = %s AND investigador_id = %s
                    """, (uid_number, iid_number))
                    
                    if not cursor.fetchone():
                        sql = """
                            INSERT INTO investigadores_usuarios (usuario_id, investigador_id)
                            VALUES (%s, %s)
                        """
                        cursor.execute(sql, (uid_number, iid_number))
                        connection.commit()
                        
            except Exception as e:
                print(f"❌ Error en fila {index} (investigadores_usuarios): {e}")
                connection.rollback()
                
    except Exception as e:
        print(f"❌ Error general en investigadores_usuarios: {e}")
        connection.rollback()
    finally:
        cursor.close()
        
def insert_investigadores_publicaciones(connection, publicaciones_data):
    cursor = connection.cursor()
    
    try:
        cursor.execute("SELECT iid_number, nombre_investigador FROM investigadores")
        investigador_map = {str(nombre).strip().lower(): iid 
                          for iid, nombre in cursor if nombre and pd.notna(nombre)}

        cursor.execute("SELECT result_code, result_description FROM publicaciones")
        publicacion_map = {str(desc).strip().lower(): code 
                          for code, desc in cursor if desc and pd.notna(desc)}
        for index, row in publicaciones_data.iterrows():
            try:
                desc_pub = str(clean_value(row.get('Results - Description', ''))).lower().strip()
                
                if not desc_pub:
                    continue
                pub_code = publicacion_map.get(desc_pub)

                if not pub_code:
                    print(f"⚠️ Publicación no encontrada: {desc_pub}")
                    continue
                
                for nombre_inv, iid in investigador_map.items():
                    if nombre_inv in desc_pub:
                        cursor.execute("""
                            SELECT 1 FROM investigadores_publicaciones 
                            WHERE investigador_id = %s AND publicacion_id = %s
                        """, (iid, pub_code))
                        
                        if not cursor.fetchone():
                            cursor.execute("""
                                INSERT INTO investigadores_publicaciones 
                                (investigador_id, publicacion_id) VALUES (%s, %s)
                            """, (iid, pub_code))
                
            except Exception as e:
                print(f"❌ Error en fila {index}: {str(e)}")
                connection.rollback()
                continue
                
        connection.commit()
                
    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        connection.rollback()
    finally:
        cursor.close()
        
def insert_usuarios_grupos(connection, usuarios_data):
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT uid_number, nombre_usuario FROM usuarios")
        usuario_map = {str(nombre).strip().lower(): uid for uid, nombre in cursor if nombre}

        cursor.execute("SELECT gid_number FROM grupos")
        grupo_set = set(row[0] for row in cursor)

        for index, row in usuarios_data.iterrows():
            try:
                nombre_usuario = clean_value(row.get('Nombre Usuario'))
                gid_number = clean_value(row.get('GidNumber'))

                if not nombre_usuario or gid_number is None:
                    continue

                nombre_usuario = str(nombre_usuario).strip().lower()
                uid_number = usuario_map.get(nombre_usuario)

                if uid_number is None:
                    print(f"⚠️ Usuario '{nombre_usuario}' no encontrado en base de datos.")
                    continue

                if gid_number not in grupo_set:
                    print(f"⚠️ Grupo {gid_number} no existe. Relación no insertada.")
                    continue

                cursor.execute("""
                    SELECT 1 FROM usuarios_grupos 
                    WHERE usuario_id = %s AND grupo_id = %s
                """, (uid_number, gid_number))

                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO usuarios_grupos (usuario_id, grupo_id) 
                        VALUES (%s, %s)
                    """, (uid_number, gid_number))
                    connection.commit()

            except Exception as e:
                print(f"❌ Error en fila {index} (usuarios_grupos): {e}")
                connection.rollback()

    except Exception as e:
        print(f"❌ Error general en usuarios_grupos: {e}")
        connection.rollback()
    finally:
        cursor.close()

def main():
    excel_data = pd.read_excel('Resumen_usuarios_Lusitania_Asier.xlsx', 
        sheet_name=["Usuarios", "Proyectos de investigación", "Publicaciones"])
    connection = create_connection()
    
    insert_grupos(connection, excel_data['Usuarios'])
    insert_usuarios(connection, excel_data['Usuarios'])
    insert_proyectos(connection, excel_data['Proyectos de investigación'])
    insert_publicaciones(connection, excel_data['Publicaciones'])
    insert_investigadores(connection, excel_data['Usuarios'])
    
    insert_usuarios_proyectos(connection, excel_data['Usuarios'], excel_data['Proyectos de investigación'])
    insert_investigadores_usuarios(connection, excel_data['Usuarios'])
    insert_investigadores_publicaciones(connection, excel_data['Publicaciones'])
    insert_usuarios_grupos(connection, excel_data['Usuarios'])
    
    connection.close()
    print("✅ Importación completada")

if __name__ == "__main__":
    main()