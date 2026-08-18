
import sys
content = open('src/stores/marcas.ts', 'r', encoding='utf-8').read()

content = content.replace('global_pleno: true', 'globalPleno: true')
content = content.replace('global_pleno: false', 'globalPleno: false')
content = content.replace('m.global_pleno === true', 'm.globalPleno === true')

open('src/stores/marcas.ts', 'w', encoding='utf-8').write(content)

