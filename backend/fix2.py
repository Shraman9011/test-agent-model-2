import os, re
for r, _, fs in os.walk('leaves/tests'):
    for f in fs:
        if f.endswith('.py'):
            p = os.path.join(r, f)
            with open(p, 'r') as file:
                content = file.read()
            
            # Find all LeaveBalance.objects.create(...)
            # Since they can span multiple lines, let's use a simple approach:
            # We just replace employee=self.xyz with employee=self.xyz.profile
            # BUT only if it's within a LeaveBalance context.
            # A hacky way: replace all, then revert LeaveRequest.objects.create
            # But tests might also have LeaveRequest.objects.filter(employee=self.user)
            
            # Better way:
            new_content = ""
            inside_lb = False
            for line in content.split('\n'):
                if 'LeaveBalance' in line and '.create' in line:
                    inside_lb = True
                if inside_lb:
                    line = re.sub(r'employee=self\.(\w+)', r'employee=self.\1.profile', line)
                    if ')' in line: # simplistic end of create
                        inside_lb = False
                new_content += line + '\n'
            
            new_content = new_content[:-1]
            with open(p, 'w') as file:
                file.write(new_content)
