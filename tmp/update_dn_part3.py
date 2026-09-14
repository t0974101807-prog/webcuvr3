import json
import sys

# Read the original file using relative path
with open('tmp/generate_units_part3.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's import the file dynamically as a module so we can inspect and manipulate 'part3'
sys.path.append('tmp')
import generate_units_part3

part3 = generate_units_part3.part3

# Define the updated 49-ward list
new_dn_wards = [
    {"Code": "18340", "FullName": "Phường Hải Châu I"},
    {"Code": "18358", "FullName": "Phường Thanh Bình"},
    {"Code": "18367", "FullName": "Phường Thuận Phước"},
    {"Code": "18376", "FullName": "Phường Hoà Cường Bắc"},
    {"Code": "18385", "FullName": "Phường Hoà Cường Nam"},
    {"Code": "18386", "FullName": "Phường Hoà Thuận Tây"},
    {"Code": "18394", "FullName": "Phường Nam Dương"},
    {"Code": "18403", "FullName": "Phường Trần Phú"},
    {"Code": "18412", "FullName": "Phường Bình Thuận"},
    {"Code": "18430", "FullName": "Phường Hoà Khánh Bắc"},
    {"Code": "18439", "FullName": "Phường Hoà Khánh Nam"},
    {"Code": "18448", "FullName": "Phường Hoà Minh"},
    {"Code": "18457", "FullName": "Phường Hoà Hiệp Bắc"},
    {"Code": "18466", "FullName": "Phường Hoà Hiệp Nam"},
    {"Code": "18484", "FullName": "Phường Thanh Khê Tây"},
    {"Code": "18493", "FullName": "Phường Thanh Khê Đông"},
    {"Code": "18502", "FullName": "Phường Xuân Hà"},
    {"Code": "18511", "FullName": "Phường Chính Gián"},
    {"Code": "18529", "FullName": "Phường Thạc Gián"},
    {"Code": "18530", "FullName": "Phường Tân Chính"},
    {"Code": "18538", "FullName": "Phường An Khê"},
    {"Code": "18547", "FullName": "Phường Hoà Phát"},
    {"Code": "18556", "FullName": "Phường Hoà An"},
    {"Code": "18565", "FullName": "Phường Thọ Quang"},
    {"Code": "18574", "FullName": "Phường Nại Hiên Đông"},
    {"Code": "18583", "FullName": "Phường Mân Thái"},
    {"Code": "18592", "FullName": "Phường An Hải Bắc"},
    {"Code": "18610", "FullName": "Phường An Hải Nam"},
    {"Code": "18619", "FullName": "Phường Phước Mỹ"},
    {"Code": "18628", "FullName": "Phường Mỹ An"},
    {"Code": "18637", "FullName": "Phường Khuê Mỹ"},
    {"Code": "18646", "FullName": "Phường Hoà Hải"},
    {"Code": "18655", "FullName": "Phường Hoà Quý"},
    {"Code": "18664", "FullName": "Phường Khuê Trung"},
    {"Code": "18673", "FullName": "Phường Hoà Thọ Đông"},
    {"Code": "18682", "FullName": "Phường Hoà Thọ Tây"},
    {"Code": "18691", "FullName": "Phường Hoà Xuân"},
    {"Code": "18700", "FullName": "Xã Hoà Phong"},
    {"Code": "18709", "FullName": "Xã Hoà Khương"},
    {"Code": "18718", "FullName": "Xã Hoà Phú"},
    {"Code": "18727", "FullName": "Xã Hoà Ninh"},
    {"Code": "18736", "FullName": "Xã Hoà Liên"},
    {"Code": "18745", "FullName": "Xã Hoà Bắc"},
    {"Code": "18754", "FullName": "Xã Hoà Sơn"},
    {"Code": "18763", "FullName": "Xã Hoà Nhơn"},
    {"Code": "18772", "FullName": "Xã Hoà Châu"},
    {"Code": "18781", "FullName": "Xã Hoà Tiến"},
    {"Code": "18790", "FullName": "Xã Hoà Phước"},
    {"Code": "18799", "FullName": "Xã Hoàng Sa"}
]

# Modify Da Nang's entry in part3 list
found = False
for item in part3:
    if item["FullName"] == "Thành phố Đà Nẵng":
        item["Wards"] = new_dn_wards
        found = True
        break

if not found:
    print("Error: Da Nang not found in part3!")
    sys.exit(1)

output = []
output.append("import json")
output.append("")
output.append("with open('./src/data/vn_only_simplified_json_generated_data_vn_units.json', 'r', encoding='utf-8') as f:")
output.append("    data = json.load(f)")
output.append("")
output.append("part3 = [")

for prov_idx, prov in enumerate(part3):
    output.append("  {")
    output.append(f'   "Code": "{prov["Code"]}",')
    output.append(f'   "FullName": "{prov["FullName"]}",')
    output.append('   "Wards": [')
    
    for ward_idx, ward in enumerate(prov["Wards"]):
        comma = "," if ward_idx < len(prov["Wards"]) - 1 else ""
        output.append(f'    {{"Code": "{ward["Code"]}", "FullName": "{ward["FullName"]}"}}{comma}')
        
    prov_comma = "," if prov_idx < len(part3) - 1 else ""
    output.append('   ]')
    output.append(f'  }}{prov_comma}')

output.append("]")
output.append("")
output.append("data.extend(part3)")
output.append("")
output.append("with open('./src/data/vn_only_simplified_json_generated_data_vn_units.json', 'w', encoding='utf-8') as f:")
output.append("    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))")
output.append("")
output.append('print("Part 3 successfully added!")')
output.append("")

# Write the new generate_units_part3.py using relative path
with open('tmp/generate_units_part3.py', 'w', encoding='utf-8') as f:
    f.write("\n".join(output))

print("Modified generate_units_part3.py successfully!")
