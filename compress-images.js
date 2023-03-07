import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";


(async () => {
    const files = await imagemin(["img/**"], {
        destination: "compressed-images",
        plugins: [
            imageminPngquant({quality: [.5, .5]})
        ]
    }).then((result) => {
        console.log('compressed!', result)
    }).catch((error) => {
        console.error(error);
    });

    console.log('files: ', files);
})();