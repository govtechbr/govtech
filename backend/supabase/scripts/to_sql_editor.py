"""Converte um teste pgTAP para rodar no SQL Editor do Supabase (sem Docker).

O SQL Editor analisa o script inteiro antes de executar, então não dá para
criar tabela auxiliar no meio do teste. Aqui o teste vira um único bloco DO:
os resultados TAP ficam numa variável e o bloco termina com RAISE EXCEPTION
mostrando-os. A exceção desfaz tudo (dados de teste e a extensão pgtap).

Uso: python scripts/to_sql_editor.py tests/core_rls.test.sql saida.sql
Requisitos do teste de origem: `begin;` e `rollback;` em linhas próprias,
`select plan(N);`, asserções começando a linha com `select <função>(` e
`select * from finish();`.
"""
import io
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
sql = io.open(src, encoding='utf-8').read()

head, body = sql.split('begin;\n', 1)
body = body.replace('rollback;\n', '')
body = re.sub(r'select plan\((\d+)\);', r'r := array[plan(\1)];', body)
asserts = r'(results_eq|is_empty|isnt_empty|lives_ok|throws_ok|isnt|is|ok)\('
body = re.sub(r'(?m)^select ' + asserts, r'r := r || \1(', body)
body = re.sub(r'(?m)^select ((?:public|private)\.\w+\()', r'perform \1', body)
body = body.replace('select * from finish();', 'r := r || array(select * from finish());')
leftover = re.search(r'(?m)^select .*', body)
if leftover:
    sys.exit('linha não convertida: ' + leftover.group(0))

out = (head + "do $tap$\ndeclare\n  r text[];\nbegin\n" + body +
       "\nraise exception E'RESULTADO DOS TESTES (erro proposital para desfazer tudo):\\n%',"
       " array_to_string(r, E'\\n');\nend\n$tap$;\n")
io.open(dst, 'w', encoding='utf-8', newline='\n').write(out)
print('ok:', dst)
