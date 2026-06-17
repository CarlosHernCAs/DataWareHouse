import time
import datetime

now = time.time()
exp = 1781561638

print("Now:", now)
print("Exp:", exp)
print("Is expired?", exp < now)

dt_now = datetime.datetime.fromtimestamp(now)
dt_exp = datetime.datetime.fromtimestamp(exp)
print("Now date:", dt_now)
print("Exp date:", dt_exp)
