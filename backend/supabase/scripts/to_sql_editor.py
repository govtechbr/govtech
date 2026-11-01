"""Converte testes pgTAP para rodar no SQL Editor do Supabase (sem Docker).

O SQL Editor analisa o script inteiro antes de executar, então não dá para
criar tabela auxiliar no meio do teste. Aqui os testes viram um único bloco DO:
cada arquivo roda num sub-bloco que termina com um erro proposital, o que
desfaz tudo o que ele criou (inclusive a extensão pgtap); os resultados TAP
ficam numa variável, que sobrevive ao desfazer. No fim, um último erro
proposital mostra o resultado de todos os arquivos de uma vez.

Uso: python scripts/to_sql_editor.py tests/a.test.sql [tests/b.test.sql ...] saida.sql
Requisitos de cada teste: `begin;` e `rollback;` em linhas próprias,
`select plan(N);`, asserções começando a linha com `select <função>(`,
chamadas de função com `select public.x(` ou `select private.x(` e
`select * from finish();`.
"""
import io
import os
import re
import sys

ASSERTS = r'(results_eq|is_empty|isnt_empty|lives_ok|throws_ok|isnt|is|ok)\('
END_OF_FILE = 'fim do arquivo de teste'


def convert_body(path):
    sql = io.open(path, encoding='utf-8').read()
    body = sql.split('begin;\n', 1)[1]
    body = body.replace('rollback;\n', '')
    body = re.sub(r'select plan\((\d+)\);', r'r := array[plan(\1)];', body)
    body = re.sub(r'(?m)^select ' + ASSERTS, r'r := r || \1(', body)
    body = re.sub(r'(?m)^select ((?:public|private)\.\w+\()', r'perform \1', body)
    body = body.replace('select * from finish();', 'r := r || array(select * from finish());')

    leftover = re.search(r'(?m)^select .*', body)
    if leftover:
        sys.exit(f'{path}: linha não convertida: {leftover.group(0)}')

    return body


def block(path):
    name = os.path.basename(path)
    return f"""
-- ===================== {name} =====================
r := array[]::text[];
begin
{convert_body(path)}
  raise exception '{END_OF_FILE}';
exception when others then
  -- o erro desfaz o que o arquivo criou; r continua com os resultados
  if sqlerrm <> '{END_OF_FILE}' then
    r := r || ('not ok - ERRO INESPERADO: ' || sqlerrm);
  end if;
end;
resultado := resultado || ('# ' || '{name}') || r;
"""


inputs, output = sys.argv[1:-1], sys.argv[-1]
if not inputs:
    sys.exit(__doc__)

script = (
    "-- Gerado por backend/supabase/scripts/to_sql_editor.py. Não versionar.\n"
    "do $tap$\ndeclare\n  r text[];\n  resultado text[] := array[]::text[];\nbegin\n"
    + ''.join(block(path) for path in inputs)
    + "\nraise exception E'RESULTADO DOS TESTES (erro proposital para desfazer tudo):\\n%',"
    " array_to_string(resultado, E'\\n');\nend\n$tap$;\n"
)
io.open(output, 'w', encoding='utf-8', newline='\n').write(script)
print('ok:', output)
