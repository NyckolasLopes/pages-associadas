import os
import re

files_to_update = [
    'src/components/storefront/Header.tsx',
    'src/components/storefront/GeoPopup.tsx'
]

geo_options = ', { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }'

for fp in files_to_update:
    if not os.path.exists(fp):
        continue
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    # The error function ends with something like 	oast.error("..."); } or setIsGeoLoading(false); }
    # We can use regex to find the closing of the error callback: \s*\}\s*\);
    # We will replace \s*\}\s*\); with }\n        ,{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }\n      ); 
    # BUT only if it is the end of navigator.geolocation.getCurrentPosition
    
    # Let's find all navigator.geolocation.getCurrentPosition calls and regex substitute within them.
    # Actually, a simpler way is:
    
    # Find:
    #         },
    #         () => {
    #           toast.error("Permissão de localização negada. Por favor, digite seu CEP manualmente.", { id: toastId });
    #         }
    #       );
    
    # It's easier to just use re.sub on the generic ending of getCurrentPosition.
    # It ends with }\n        ); or }\n      );
    content = re.sub(r'(\}\s*)\);', r'\1' + geo_options + ');', content)
    
    # Wait, what if it matches other functions? 
    # Yes, it will match EVERY });.
    
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done')
