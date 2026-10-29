@echo off
cd /d "%~dp0"
python compilador.py
if errorlevel 1 pause
