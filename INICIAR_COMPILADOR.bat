@echo off
cd /d "%~dp0escritorio"
python compilador.py
if errorlevel 1 pause
