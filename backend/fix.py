import os, re
for r, _, fs in os.walk('leaves/tests'):
    for f in fs:
        if f.endswith('.py'):
            p = os.path.join(r, f)
            with open(p, 'r') as file:
                content = file.read()
            content = re.sub(r'employee=self\.(\w+),', r'employee=self.\1.profile,', content)
            with open(p, 'w') as file:
                file.write(content)
