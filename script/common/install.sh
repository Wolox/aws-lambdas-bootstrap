install_apex ()
{
  # Refer to the Readme 'Ubuntu installation & usage' section for understanding this
  if [[ "`uname`" == 'Linux' ]]; then
    sudo ln -sf bash /bin/sh
  fi
  if type bundle > /dev/null
  then
    echo ""
    echo " → Upgrading Apex"
    echo ""
    sudo apex upgrade
    echo ""
    echo "  ✔ Apex successfully installed"
  else
    echo ""
    echo " → Installing Apex"
    echo ""
    curl -s https://raw.githubusercontent.com/apex/apex/master/install.sh | sudo sh > /dev/null
    echo ""
    echo "  ✔ Apex successfully installed"
  fi
}

install_nvm ()
{
  echo ""
  echo " → Installing nvm"
  echo ""
  if [ -f ~/.nvm/nvm.sh ]
  then
    echo "  ✔ nvm is already installed"
  else
    curl -s -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.4/install.sh | bash > /dev/null
    echo ""
    echo "  ✔ nvm successfully installed"
  fi
  source ~/.nvm/nvm.sh
}

install_node ()
{
  echo ""
  echo " → Installing node v'$(cat .nvmrc)'"
  echo ""
  nvm install
  echo ""
  echo "  ✔ node v'$(cat .nvmrc)' successfully installed"
}

install_npm_packages ()
{
  echo ""
  echo " → Installing npm packages"
  echo ""
  source ~/.nvm/nvm.sh
  cd lib
  nvm exec npm install
  cd ..
  cd local
  nvm exec npm install
  cd node_modules
  ln -s ../../lib aws-lambdas-bootstrap
  cd ..
  cd ..
  echo "  ✔ npm packages successfully installed"
}
