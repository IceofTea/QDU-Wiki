# 维护说明

本页面向维护者介绍 Wiki 的上传与本地部署方式。返回 [关于 Wiki](index.md)。

## 腾讯文档维护

觉得 GitHub 有难度、只是想顺手补条信息？可以直接编辑 [《青岛大学 Wiki 校园指南》腾讯文档](https://docs.qq.com/aio/DVFJnbFR3TWdzbFVn)（登录后按左侧目录树对应板块修改即可），管理员会定期把社区在腾讯文档里补充的新内容同步回本站。**这是零门槛的维护方式，推荐给不熟悉 Git 的朋友。**

## 上传文件

**步骤：**

1. 把要分享的文件放入 `docs/share/files/` 目录
2. 在文件共享主页（`docs/share/index.md`）的列表中，按 Markdown 格式添加一行引用：

    ```markdown
    [资料名称](files/资料名称.pdf)
    ```

    !!! example "示例"
        ```markdown
        [青岛大学本科新生指南.pdf](files/青岛大学本科新生指南.pdf)
        ```
        渲染后即为可点击下载的链接。

**注意事项：**

- 文件请用**简洁贴切的中文名**，如 `青岛大学本科新生指南.pdf`
- 体积较大的文件（如几十 MB 的压缩包、视频）**不建议直接放进仓库**，可先上传到**网盘**（百度网盘、阿里云盘）或 GitHub Releases，再在主页放下载链接：

    ```markdown
    [资料名称](下载链接)
    ```

- 涉及个人隐私的信息（姓名、学号、身份证号等）请先**脱敏**再上传

## 上传图片

**步骤：**

1. 图片统一放在 `docs/pics/` 目录下，**并按板块放入对应的子文件夹**：

    | 子文件夹 | 对应板块 |
    | --- | --- |
    | `pics/home/` | 首页配图 |
    | `pics/new/` | 新生手册 |
    | `pics/live/` | 生活指南 |
    | `pics/study/` | 学习学业 |
    | `pics/service/` | 校园服务 |
    | `pics/college/` | 学院详情 |
    | `pics/organization/` | 学生组织 |
    | `pics/share/` | 文件共享 |
    | `pics/words/` | 有话送你 |
    | `pics/about/` | 关于 Wiki |

2. 命名格式：`<页面名>-图<编号>-<说明>.png`，例如 `study-图1-校历.png`
3. 在页面中按 Markdown 格式引用：

    ```markdown
    ![图片说明](路径)
    ```

    !!! example "示例"
        - 在 `docs/study/system.md` 里引用：`![2026校历](../pics/study/study-图1-校历.png)`
        - 在 `docs/new/preparation.md` 里引用同一张图：`![2026校历](../pics/study/study-图1-校历.png)`
        - 在 `docs/index.md` 里引用：`![2026校历](pics/study/study-图1-校历.png)`

**注意事项：**

- 子文件夹与页面目录一一对应，找不到对应板块的配图放 `home/`
- 优先使用 `.png` / `.jpg` 格式，图片尽量压缩小一点，避免拖慢网页加载
- 配图请使用自己拍摄或获得授权的图片，避免版权问题

## 如何维护本板块

本 Wiki 以「Markdown 文件 + 配置文件」的方式搭建，维护非常简单：

- **新增 / 修改内容**：直接在 `docs/` 目录下新建或编辑 `.md` 文件即可，无需编写任何代码
- **更新导航**：新页面建好后，只需在根目录的 `mkdocs.yml` 的 `nav` 中加一行，例如：

    ```yaml
    - 新板块:
      - 新页面: new/page.md
    ```

- **本地部署**：安装依赖后执行 `mkdocs serve` 即可本地预览，具体步骤见下方「本地部署」

> 维护原则：**页面只存文字和链接，数据尽量放外部存储**，这样 Wiki 会始终保持轻量、易维护。

## 本地部署

想在本机预览或修改 Wiki，需要先安装依赖（需已安装 [Python](https://www.python.org/downloads/)）：

```bash
pip install mkdocs-material mkdocs-git-revision-date-localized-plugin mkdocs-git-committers-plugin
```

然后在项目根目录启动本地预览：

```bash
mkdocs serve
```

浏览器打开 http://127.0.0.1:8000 即可预览，修改文件后页面会自动刷新。

!!! note "提示"
    - 上面这条命令装的是本地预览所需的最小依赖，与线上构建（GitHub Actions）保持一致
    - 若提示命令找不到，把 Python 的 Scripts 目录加到系统 PATH，或改用 `python -m mkdocs serve`
    - 8000 端口被占用时，可指定其他端口：`mkdocs serve -a 127.0.0.1:8123`
