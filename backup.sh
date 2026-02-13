#!/bin/bash

printf -v date '%(%Y%m%d_%H%M%S)T\n' -1
now=$(date +%F_%H-%M-%S)
echo "now: ${now}"
zip -r /mnt/HC_Volume_102781745/blackmoon/blackmoon_${now}.zip /node/blackmoon/data /node/blackmoon/media /node/blackmoon/hex-images
echo "Backup complete: /mnt/HC_Volume_102781745/blackmoon/blackmoon_${now}.zip"