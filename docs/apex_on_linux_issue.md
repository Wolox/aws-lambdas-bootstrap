# Apex on Linux issue

If you are using Ubuntu (or other Linux distribution), apex have an issue: it heads all its files with `#!/bin/sh`, and that's why you may see the following error code when trying to execute some task (e.g.: `$ apex deploy`)

`Error: function build hook: sh: 1: source: not found`

This error is caused as `/bin/sh` is a link to `dash` system shell, i.e., `dash` system shell will be used instead of `bash` system shell.

If you have already installed apex, remove it (default location: `/usr/local/bin/apex`) and follow the below steps:

1. Replace the current link using `-f` to **force** the overwrite

  `$ sudo ln -sf bash /bin/sh`

2. [Install & update apex](http://apex.run/#installation)

3. Run the script you want, for example, `$ apex deploy`

4. If you want, restore your default system configuration

  `$ sudo ln -sf dash /bin/sh`

Note that, **to run a new script**, if you have restored your system configuration, you will have to execute again step 1, run the desired script, and then step 4 again.
