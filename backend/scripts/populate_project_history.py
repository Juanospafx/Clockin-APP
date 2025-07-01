# backend/scripts/populate_project_history.py

import os
import sys

# (Opcional: si no has convertido 'scripts/' en paquete, 
#  usa esto para que Python encuentre 'app/' en sys.path)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from uuid import uuid4
from app.database import SessionLocal
from app.models import ProjectHistory, Project, Clockin, User

def backfill_history():
    db = SessionLocal()

    # 1) Recorremos todos los proyectos existentes
    proyectos = db.query(Project).all()
    for proj in proyectos:
        # 2) Buscamos los clockins ya completados para ese proyecto
        clockins = (
            db.query(Clockin)
            .filter(
                Clockin.project_id == proj.id,
                Clockin.end_time.isnot(None)
            )
            .all()
        )

        # 3) Para cada clockin terminado, creamos una fila en project_history
        for clk in clockins:
            # Verificamos que no exista ya un registro idéntico
            existe = (
                db.query(ProjectHistory)
                .filter(
                    ProjectHistory.project_id == proj.id,
                    ProjectHistory.clockin_id == clk.id
                 )
                .first()
            )
            if existe:
                continue

            # Insertamos solo los campos que sí existen en ProjectHistory
            nueva_hist = ProjectHistory(
                id         = uuid4(),
                project_id = proj.id,
                user_id    = clk.user_id,
                clockin_id = clk.id,
                date       = clk.end_time  # o datetime.utcnow(), según prefieras
            )
            db.add(nueva_hist)

        db.commit()

    db.close()
    print("✔️  Terminado: project_history ha sido poblado con datos preexistentes.")

if __name__ == "__main__":
    backfill_history()
