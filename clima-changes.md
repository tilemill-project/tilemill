### Changes TO BE DONE for CLIMA

-ao adicionar novo layer postgis, damos apenas o nome da tabela; depois de clickar no botao save temos de acrescentar o schema onde estao as tabelas postgis (geo). Este schema deve estar no clima-settings.json

-ao adicionar novo layer, desactivar a tab "files"? (como feito para a tab sqlite - ver em baixo)

-DONE quando estamos a criar o projecto, 
  -no campo file, aplicar uma funcao de tirar os acentos 
  -mudar a descricao de "file" para "name2
  -no campo name, nao mostrar e garantir que é preenchida com o mesmo que foi no file (que agora se chama name)

-DONE zoom/centro por omissao: ler de um ficheiro de opcoes

-instalar plugins que permitem ordenar tabelas e pan suave no mapa


### Changes done for CLIMA

### custom settings

The custom settings should be placed in `clima-settings.json` (not in the git repository).

### When adding a new layer, disable the sqlite tab

In `templates/Layer._`, set the `enabled` object at the top.

### views/Layer.bones

In the `render` method we set default default values for these fields and then hide them
  - "Connection"
  - "Unique key field"
  - "Geometry field"

### servers/Tile.bones

In the `server.prototype.datasource` method we hardcoded the postgres connection info (read from "clima-settings.json")

### models/Project.server.bones

Similar to the above, in the `loadProject` function we hardcoded the postgres connection info (read from "clima-settings.json")


