# Contributing

<a href="CONTRIBUTING.md">العربية</a> · <a href="CONTRIBUTING.en.md">English</a>

Welcome to **The Command Line Series**. This repository contains six completed
Arabic books, their Typst sources, build tools, covers, and release files.

## Before contributing

- Read the [README](README.md) and the [license](LICENSE).
- Check [project status](PROJECT-STATUS.md) before starting work.
- Do not rebuild or alter completed book files merely to update documentation.
- Use clear LTR formatting for paths, commands, and code, and keep Arabic prose
  in its appropriate RTL direction.

## License and modification limits

Public content explicitly listed in `LICENSES/README.md` is offered under
**CC BY-SA 4.0** beginning with version 1.3. It may be copied, translated,
adapted, printed, and sold with attribution, an indication of changes, and
ShareAlike. Original code explicitly listed in the map is under MIT. Internal
files, excluded assets, and third-party material are outside that offer.

Therefore:

- Report errors and suggestions through [Issues](https://github.com/ghazi-alsaif/command-line-series/issues).
- Pull Requests may correct or translate book text when their scope and sources
  are clear.
- Documentation, tooling, and README improvements are welcome when they do not
  change the books or released files without prior coordination.

## Useful contributions

- Correct an outdated link, description, or path in the documentation.
- Improve build or EPUB tools without intentionally changing book output.
- Improve accessibility, RTL/LTR handling, and responsive README presentation.
- Report a technical or language issue with the exact file, location, and source.

## Contributing to the English edition

The current edition of the series is Arabic only. Community translations do
not require separate permission beyond the CC BY-SA conditions. An official
translation must follow [`TRANSLATION-GUIDE.md`](TRANSLATION-GUIDE.md).
Independent translations must be labeled unofficial and must not imply project
approval.

## Build and verification

From the repository root, use `build.sh` for a local build:

```bash
./build.sh
./build.sh 6-unix-story
```

Do not commit local `build/` output. Public downloads are attached to the
[GitHub release](https://github.com/ghazi-alsaif/command-line-series/releases).

For project contact or contribution coordination, open an
[Issue](https://github.com/ghazi-alsaif/command-line-series/issues).
