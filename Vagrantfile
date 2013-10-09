# -*- mode: ruby -*-
# vi: set ft=ruby :

# TODO: use our recipe for tika
$script = <<SCRIPT
//>script inline
sudo apt-get update;
sudo apt-get install -y autoconf libtool \
 libpng12-dev zlibc zlib1g-dev libtiff-dev libungif4-dev libjpeg-dev \
 libxml2-dev libuninameslist-dev xorg-dev subversion cvs gettext git \
 libpango1.0-dev libcairo2-dev python-dev uuid-dev libreadline-dev \
 cmake util-linux pkg-config libpng-dev \
 poppler-data git libfontconfig-dev gettext libcairo2-dev \
 libtool;

mkdir deps;cd deps;
wget http://poppler.freedesktop.org/poppler-0.24.2.tar.xz;
tar -xvJf poppler-0.24.2.tar.xz;
cd poppler-0.24.2;
./configure --enable-xpdf-headers;
make;
sudo make install;
cd ..;

# may need a FreeType Install
# and libSpiro

git clone https://github.com/coolwanglu/fontforge.git;
cd fontforge;
./autogen.sh;
./configure;
make;
sudo make install;

cd ..;
git clone git://github.com/coolwanglu/pdf2htmlEX.git;
cd pdf2htmlEX;
cmake . && make && sudo make install;
echo "\nexport LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH;" > /home/vagrant/.bashrc
SCRIPT

Vagrant.configure("2") do |config|
  config.vm.hostname = "cluestrhydraterpdf"

  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"

  config.vm.network :forwarded_port, host: 8000, guest: 8000

  config.berkshelf.berksfile_path = "./Berksfile"
  config.berkshelf.enabled = true
  config.omnibus.chef_version = '11.6.0'

  config.vm.provision :chef_solo do |chef|
    chef.run_list = [
      "recipe[apt]",
      "recipe[java]",
      "recipe[nodejs]",
    ]

    chef.json = {
      :java => {
        :install_flavor => "openjdk",
        :jdk_version => "7"
      }
    }
  end

  config.vm.provision :shell,
      :inline => $script
end
