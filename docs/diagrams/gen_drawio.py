"""Generate docs/diagrams/lumo.drawio (2 pages). Export PNGs with the diagrams.net viewer.

    python docs/diagrams/gen_drawio.py
"""

from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).with_name("lumo.drawio")

TITLE = (
    "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;"
)
PALETTE = {
    "client": ("#E1D5E7", "#9673A6"),
    "proxy": ("#DAE8FC", "#6C8EBF"),
    "api": ("#FFE6CC", "#D79B00"),
    "data": ("#F8CECC", "#B85450"),
    "ai": ("#D5E8D4", "#82B366"),
    "ext": ("#F5F5F5", "#666666"),
    "step": ("#FFFFFF", "#6C8EBF"),
}


class Page:
    def __init__(self, name: str, width: int = 1600, height: int = 900):
        self.name, self.w, self.h = name, width, height
        self.cells: list[str] = []
        self.n = 1

    def _id(self) -> str:
        self.n += 1
        return f"c{self.n}"

    def title(self, heading: str, sub: str) -> None:
        value = (
            f'<b style="font-size:20px;">{escape(heading)}</b><br>'
            f'<span style="font-size:12px;color:#666;">{escape(sub)}</span>'
        )
        self.cells.append(self._cell(self._id(), value, TITLE, self.w / 2 - 400, 14, 800, 46))

    @staticmethod
    def _cell(cid, value, style, x, y, w, h, vertex=True, extra="") -> str:
        value = escape(value, {'"': "&quot;"})
        return (
            f'<mxCell id="{cid}" value="{value}" style="{style}" vertex="1" parent="1"{extra}>'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )

    def box(self, kind, label, x, y, w, h, *, sub="", dashed=False, bold=True) -> str:
        fill, stroke = PALETTE[kind]
        text = f"<b>{escape(label)}</b>" if bold else escape(label)
        if sub:
            text += f'<br><span style="font-size:11px;color:#555;">{sub}</span>'
        style = (
            f"rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor={fill};strokeColor={stroke};"
            f"strokeWidth=2;fontSize=13;{'dashed=1;' if dashed else ''}"
        )
        cid = self._id()
        self.cells.append(self._cell(cid, text, style, x, y, w, h))
        return cid

    def group(self, kind, label, x, y, w, h) -> None:
        fill, stroke = PALETTE[kind]
        style = (
            f"rounded=1;whiteSpace=wrap;html=1;arcSize=3;fillColor={fill};strokeColor={stroke};"
            "strokeWidth=2;dashed=1;verticalAlign=top;align=left;spacingLeft=12;spacingTop=6;"
            "fontStyle=1;fontSize=13;opacity=45;"
        )
        self.cells.append(self._cell(self._id(), label, style, x, y, w, h))

    def note(self, text, x, y, w, h) -> None:
        style = (
            "rounded=1;whiteSpace=wrap;html=1;arcSize=6;fillColor=#f5f5f5;strokeColor=#666666;"
            "align=left;verticalAlign=top;spacing=10;fontSize=12;"
        )
        self.cells.append(self._cell(self._id(), text, style, x, y, w, h))

    def edge(self, src, dst, label="", *, color="#333333", dashed=False, exit=None, entry=None):
        style = (
            "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;"
            f"strokeColor={color};strokeWidth=2;fontSize=11;fontColor={color};labelBackgroundColor=#ffffff;"
            f"{'dashed=1;' if dashed else ''}"
        )
        if exit:
            style += f"exitX={exit[0]};exitY={exit[1]};exitDx=0;exitDy=0;"
        if entry:
            style += f"entryX={entry[0]};entryY={entry[1]};entryDx=0;entryDy=0;"
        cid = self._id()
        self.cells.append(
            f'<mxCell id="{cid}" value="{escape(label)}" style="{style}" edge="1" parent="1" '
            f'source="{src}" target="{dst}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    def xml(self) -> str:
        return (
            f'<diagram name="{escape(self.name)}" id="{self.name.lower().replace(" ", "-")}">'
            f'<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" '
            f'pageHeight="{self.h}" math="0" shadow="0"><root><mxCell id="0"/>'
            f'<mxCell id="1" parent="0"/>{"".join(self.cells)}</root></mxGraphModel></diagram>'
        )


def deployment() -> Page:
    p = Page("Deployment", 1700, 800)
    p.title("Lumo: one image, any Firebase", "React · nginx (non-root) · Firebase Auth, Firestore, Storage")

    browser = p.box("client", "Browser", 40, 300, 220, 100, sub="React SPA, mobile first<br>camera or gallery upload")
    p.group("proxy", "Container: ghcr.io/andresazcona/lumo", 360, 220, 480, 260)
    nginx = p.box("proxy", "nginx (non-root)", 400, 270, 400, 80, sub="serves the built SPA<br>SPA fallback for /feed, /profile")
    cfg = p.box("proxy", "/config.js", 400, 380, 400, 70, sub="written at start from environment variables<br>USE_EMULATORS or FIREBASE_*")

    own = p.box("ai", "Your Firebase project", 980, 130, 300, 150, sub="Auth (Google, email)<br>Firestore (photo records)<br>Storage (the images)<br>+ the rules in this repo")
    emu = p.box("ext", "docker compose: local emulators", 980, 450, 300, 150, dashed=True,
                sub="Auth 9099 · Firestore 8088 · Storage 9199<br>same rules, no project needed<br>memory only: gone when stopped")

    p.edge(browser, nginx, "HTTPS", color="#6C8EBF", exit=(1, 0.3), entry=(0, 0.5))
    p.edge(nginx, cfg, "", color="#6C8EBF", exit=(0.5, 1), entry=(0.5, 0))
    p.edge(browser, own, "SDK calls (rules enforced)", color="#82B366", exit=(0.5, 0), entry=(0, 0.5))
    p.edge(browser, emu, "SDK calls (local)", color="#666666", dashed=True, exit=(0.5, 1), entry=(0, 0.5))

    p.note(
        "<b>Choosing the backend</b><br>"
        "• <code>docker compose up</code>: everything local, nothing leaves your machine<br>"
        "• <code>docker run -e FIREBASE_API_KEY=… ghcr.io/andresazcona/lumo</code>: your own project<br>"
        "• values are stripped of quotes before they reach the page: they cannot break out of their string",
        360, 650, 920, 100,
    )
    p.note(
        "<b>No public demo, on purpose.</b> People post personal photos here, so Lumo is "
        "something you run for your own event, not a service.",
        40, 650, 280, 100,
    )
    return p


def upload_flow() -> Page:
    p = Page("Posting a photo", 1700, 700)
    p.title("What happens to a photo, and what the rules enforce", "Storage first, then the Firestore record")

    steps = [
        ("client", "1. Pick", "camera or gallery"),
        ("client", "2. Compress", "over 3 MB: max 1920 px JPEG,<br>sizes and dimensions recorded"),
        ("data", "3. Upload", "Storage<br>photos/&lt;uid&gt;/&lt;timestamp&gt;.jpg"),
        ("data", "4. Record", "Firestore photos/&lt;id&gt;<br>owner, URL, size, server time"),
        ("api", "5. Feed", "signed-in users only<br>newest first, infinite scroll"),
    ]
    ids = []
    for i, (kind, label, sub) in enumerate(steps):
        ids.append(p.box(kind, label, 40 + i * 320, 130, 270, 110, sub=sub))
    for a, b in zip(ids, ids[1:], strict=False):
        p.edge(a, b, color="#333333")

    p.note(
        "<b>Storage rules</b><br>"
        "• only a signed-in user, only into their own folder (photos/&lt;their uid&gt;/…)<br>"
        "• only image/* files, under 10 MB<br>"
        "• update and delete are denied: a photo is never edited or deleted<br>"
        "• reads need a signed-in user",
        670, 300, 600, 160,
    )
    p.note(
        "<b>Firestore rules</b><br>"
        "• ownerUid must equal the caller: nobody posts as someone else<br>"
        "• createdAt must be the server time: nobody back-dates a photo<br>"
        "• update and delete are denied for everyone<br>"
        "• profiles: readable when signed in, writable only by their owner",
        40, 300, 600, 160,
    )
    p.note(
        "<b>All of this is tested.</b> tests/rules runs 18 cases against the real Firebase emulators "
        "on every push: anonymous access, other people's folders, wrong file types, 10 MB limit, "
        "back-dated records, edits and deletes.",
        1300, 300, 330, 160,
    )
    return p


def main() -> None:
    pages = [deployment(), upload_flow()]
    OUT.write_text(
        '<mxfile host="app.diagrams.net">' + "".join(pg.xml() for pg in pages) + "</mxfile>",
        encoding="utf-8",
    )
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
