#!/usr/bin/env python3
"""
Regenerate aws-monthly-commits.png for the GitHub profile README.

Rolling 12-month window of AWS CodeCommit (PSA / Waltworks) monthly commits.
Edit MONTHS / VALUES to advance the window, then run:  python3 gen-aws-chart.py
It prints the total so you can sync the README stat line.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

# rolling 12-month window (oldest -> newest). Advance by dropping the front and
# appending the newest month(s).
MONTHS = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"]
YEARS  = {0: "25", 5: "26"}          # year caption under Aug 25 and Jan 26
VALUES = [345, 355, 370, 380, 395, 395, 300, 335, 310, 290, 420, 410]

BG = "#0d1117"; BAR = "#7c6cf5"; GRID = "#21262d"; TXT = "#c9d1d9"; MUT = "#8b949e"
total = sum(VALUES)

fig, ax = plt.subplots(figsize=(12.5, 5.6), dpi=150)
fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

x = range(len(MONTHS))
bars = ax.bar(x, VALUES, width=0.68, color=BAR, zorder=3)
for xi, v in zip(x, VALUES):
    ax.text(xi, v + 8, str(v), ha="center", va="bottom",
            color=TXT, fontsize=12, fontweight="bold")

ax.set_title(f"AWS CodeCommit — Monthly Commits ({total:,} total)",
             color="#f0f6fc", fontsize=17, fontweight="bold", pad=22)
ax.set_ylabel("Commits", color=MUT, fontsize=12)
ax.set_ylim(0, 440)
ax.yaxis.set_major_locator(MultipleLocator(100))
ax.tick_params(colors=MUT, labelsize=11, length=0)
ax.set_xticks(list(x))
ax.set_xticklabels(MONTHS, color=MUT, fontsize=12)
for i, yr in YEARS.items():
    ax.text(i, -58, yr, ha="center", va="top", color=MUT, fontsize=11)

ax.yaxis.grid(True, color=GRID, linewidth=1, zorder=0)
ax.set_axisbelow(True)
for s in ("top", "right", "left", "bottom"):
    ax.spines[s].set_visible(False)

plt.subplots_adjust(left=0.06, right=0.98, top=0.86, bottom=0.14)
fig.savefig("aws-monthly-commits.png", facecolor=BG)
print(f"total={total:,}")
