# Maintenance Guide

This page introduces the upload and local deployment methods for maintainers. Return to [About Wiki](index.md).

## Tencent Docs Maintenance

Find GitHub difficult and just want to add a piece of information? You can directly edit the [Qingdao University Wiki Campus Guide Tencent Docs](https://docs.qq.com/aio/DVFJnbFR3TWdzbFVn) (log in and modify according to the corresponding section in the left directory tree). Administrators will regularly sync new content supplemented by the community in Tencent Docs back to this site. **This is a zero-threshold maintenance method, recommended for friends unfamiliar with Git.**

## Upload Files

**Steps:**

1. Put the files to share into the `docs/share/files/` directory
2. In the list on the file sharing homepage (`docs/share/index.md`), add a line of reference in Markdown format:

    ```markdown
    [Material Name](files/Material Name.pdf)
    ```

    !!! example "Example"
        ```markdown
        [Qingdao University Undergraduate Freshman Guide.pdf](files/éå²å¤§å­¦æ¬ç§æ°çæå.pdf)
        ```
        After rendering, it becomes a clickable download link.

**Notes:**

- Files should have **concise and appropriate Chinese names**, such as `éå²å¤§å­¦æ¬ç§æ°çæå.pdf`
- Larger files (such as tens of MB compressed packages, videos) **are not recommended to be directly placed in the repository**. You can first upload them to a **cloud drive** (Baidu Netdisk, Alibaba Cloud Disk) or GitHub Releases, then put the download link on the homepage:

    ```markdown
    [Material Name](Download Link)
    ```

- Information involving personal privacy (name, student ID, ID number, etc.) should be **desensitized** before uploading

## Upload Images

**Steps:**

1. Images are uniformly placed in the `docs/pics/` directory, **and placed in corresponding subfolders according to sections**:

    | Subfolder | Corresponding Section |
    | --- | --- |
    | `pics/home/` | Homepage illustrations |
    | `pics/new/` | New student manual |
    | `pics/live/` | Life guide |
    | `pics/study/` | Study and academics |
    | `pics/service/` | Campus services |
    | `pics/college/` | College details |
    | `pics/organization/` | Student organizations |
    | `pics/share/` | File sharing |
    | `pics/words/` | Words for you |
    | `pics/about/` | About Wiki |

2. Naming format: `<Page Name>-Fig<Number>-<Description>.png`, for example `study-å?-æ ¡å.png`
3. Reference in the page in Markdown format:

    ```markdown
    ![Image Description](Path)
    ```

    !!! example "Example"
        - Reference in `docs/study/system.md`: `![2026æ ¡å](../../../pics/study/study-å?-æ ¡å.png)`
        - Reference the same image in `docs/new/preparation.md`: `![2026æ ¡å](../../../pics/study/study-å?-æ ¡å.png)`
        - Reference in `docs/index.md`: `![2026æ ¡å](pics/study/study-å?-æ ¡å.png)`

**Notes:**

- Subfolders correspond one-to-one with page directories; images that cannot find a corresponding section are placed in `home/`
- Preferably use `.png` / `.jpg` format; compress images as much as possible to avoid slowing down webpage loading
- Please use images you have taken or obtained authorization for to avoid copyright issues

## How to Maintain This Section

This Wiki is built in the "Markdown files + configuration files" method, maintenance is very simple:

- **Add / Modify content**: Directly create or edit `.md` files in the `docs/` directory, no need to write any code
- **Update navigation**: After a new page is created, just add a line in the `nav` of the root directory's `mkdocs.yml`, for example:

    ```yaml
    - New Section:
      - New Page: new/page.md
    ```

- **Local deployment**: After installing dependencies, execute `mkdocs serve` for local preview. For specific steps, see "Local Deployment" below

> Maintenance principle: **Pages only store text and links, data should be stored externally as much as possible**, so the Wiki will always remain lightweight and easy to maintain.

## Local Deployment

To preview or modify the Wiki on your local machine, you need to install dependencies first (requires [Python](https://www.python.org/downloads/) to be installed):

```bash
pip install mkdocs-material mkdocs-git-revision-date-localized-plugin mkdocs-git-committers-plugin
```

Then start local preview in the project root directory:

```bash
mkdocs serve
```

Open http://127.0.0.1:8000 in a browser to preview; the page will automatically refresh after modifying files.

!!! note "Tip"
    - The above command installs the minimum dependencies required for local preview, consistent with online build (GitHub Actions)
    - If the command is not found, add Python's Scripts directory to the system PATH, or use `python -m mkdocs serve` instead
    - When port 8000 is occupied, you can specify another port: `mkdocs serve -a 127.0.0.1:8123`