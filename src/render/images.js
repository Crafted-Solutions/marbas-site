//const Image = require("@11ty/eleventy-img");

import Image from "@11ty/eleventy-img";
import { createFallbackImageHtml, shouldBypassEleventyImageProcessing } from "./image-processing.js";

const bypassImageProcessing = shouldBypassEleventyImageProcessing();

if (bypassImageProcessing) {
  console.warn("[marbas:image] Bypassing eleventy-img processing on this runtime.");
}







// async function imageShortcode2 (id, alt, widths, lightbox, lightboxOptions, sizes="(min-width: 1024px) 100vw, 50vw") {

//     if(id==undefined) return "";
  
//     var caption = "";
  
//     let src = `${MarbasConf.marbasDomain}${MarbasConf.marbasPathApi}File/${id}/Attachment`;
  
//     if(widths == undefined || widths == null){
//       widths = [400, 600, 800, 1320];
//     }
  
//     if(lightbox == undefined || lightbox == null){
//       lightbox = false;
//     }
  
//     if(lightboxOptions != undefined ){
//       if(lightboxOptions.caption != undefined){
//         caption = `<div class='box-content-caption'>${lightboxOptions.caption[0].value}</div>`;
//       }
//     }
  
//     let options = {
//       cacheOptions: {
//         // if a remote image URL, this is the amount of time before it fetches a fresh copy
//         duration: "1d",
//         // project-relative path to the cache directory
//         directory: ".cache",
//         removeUrlQueryParams: false,
//         fetchOptions:{
//           headers: Marbas.headers,
//           agent: new https.Agent({
//             rejectUnauthorized: false
//           })
//         }
//       },
//       widths: widths,
//       formats: ["webp", "jpeg"],
//       urlPath: "/images/",
//       outputDir: "./public/images/",
//       filenameFormat: function (id, src, width, format, options) {
//         return `${id}-${width}w.${format}`
//       }
//     }
  
//     // generate images
//     //Image(src, options);
  
//     let imageAttributes = {
//       alt,
//       sizes,
//       loading: "lazy",
//       decoding: "async",
//     }
//     // get metadata
//     let metadata = await Image(src, options);
  
//     let img = Image.generateHTML(metadata, imageAttributes);
  
//     if(lightbox == true){
//       img = "<light-box><div class='box'><div class='box-content'><div class='box-content-x'>x</div>" + img + caption + "</div></div>";
//     }
//     return img
//   }



/**
 * get Media of Type Image
 * 
 * obsolet
 */
// async function getMediaImageHTML(id, alt, widths, lightbox, lightboxOptions, sizes="(min-width: 1024px) 100vw, 50vw"){

//     if(id==undefined) return "";
  
//     let imageTrait = await Marbas.getTrait(id);
  
  
//     var media = {
//       image:{
//         id:imageTrait.yield.Image != undefined ? imageTrait.yield.Image[0].value : null
//       },
//       alt: imageTrait.yield.AltText != undefined ? imageTrait.yield.AltText[0].value : "",
//       description: imageTrait.yield.Description != undefined ? imageTrait.yield.Description[0].value : "",
//       source : imageTrait.yield.Source != undefined ? imageTrait.yield.Source[0].value : "",
//       copyright :  imageTrait.yield.Copyright != undefined ? imageTrait.yield.Copyright[0].value : ""
//     }
  
//     if(media.image.id == null) return;
//     await getMediaInfo(media.image);
  
//     var caption = "";
  
//     let src = `${MarbasConf.marbasDomain}${MarbasConf.marbasPathApi}File/${media.image.id}/Attachment`;
  
//     if(widths == undefined || widths == null){
//       widths = [400, 600, 800, 1320];
//     }
  
//     if(lightbox == undefined || lightbox == null){
//       lightbox = false;
//     }
  
//     if(lightboxOptions != undefined ){
//       //console.dir(lightboxOptions);
//       if(lightboxOptions.caption != undefined){
//         caption = `<div class='box-content-caption'>${lightboxOptions.caption[0].value}</div>`;
//       }
//     }
  
//     let options = {
//       cacheOptions: {
//         // if a remote image URL, this is the amount of time before it fetches a fresh copy
//         duration: "1d",
//         // project-relative path to the cache directory
//         directory: ".cache",
//         removeUrlQueryParams: false,
//         fetchOptions:{
//           headers: Marbas.headers,
//           agent: new https.Agent({
//             rejectUnauthorized: false
//           })
//         }
//       },
//       widths: widths,
//       formats: ["webp", "jpeg"],
//       urlPath: "/images/",
//       outputDir: "./public/images/",
//       filenameFormat: function (id, src, width, format, options) {
//         return `${id}-${width}w.${format}`
//       }
//     }
  
//     // generate images
//     //Image(src, options);
  
//     let imageAttributes = {
//       alt,
//       sizes,
//       loading: "lazy",
//       decoding: "async",
//     }
//     // get metadata
//     let metadata = await Image(src, options);
  
//     let img = Image.generateHTML(metadata, imageAttributes);
//     //console.log("metadata:  " + metadata);
//     //console.dir(metadata);
  
//     if(lightbox == true){
//       img = "<light-box><div class='box'><div class='box-content'><div class='box-content-x'>x</div>" + img + caption + "</div></div>";
//     }
//     return img;
//   }


  /**
 * get Media of Type Image
 */
async function getMediaImageAsHTML(path, id, media, fetchOptions, alt, widths, lightbox, lightboxOptions, outputDir, sizes="(min-width: 1024px) 100vw, 50vw"){

  
    var caption = "";
  
    let src = path;

    if(widths == undefined || widths == null){
      widths = [400, 600, 800, 1320];
    }
  
    if(lightbox == undefined || lightbox == null){
      lightbox = false;
    }
  
    if(lightboxOptions != undefined ){
      if(lightboxOptions.caption != undefined){
        caption = `<div class='box-content-caption'>${lightboxOptions.caption[0].value}</div>`;
      }
    }
  
    let options = {
      cacheOptions: {
        // if a remote image URL, this is the amount of time before it fetches a fresh copy
        duration: "1d",
        // project-relative path to the cache directory
        directory: ".cache",
        removeUrlQueryParams: false,
        fetchOptions:fetchOptions
      },
      widths: widths,
      formats: ["webp", "jpeg"],
      urlPath: "/images/",
      outputDir: `./${outputDir}images/`,
      filenameFormat: function (id, src, width, format, options) {
        return `${id}-${width}w.${format}`
      }
    }
  
    let imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    }

    if (bypassImageProcessing) {
      let img = createFallbackImageHtml({
        src,
        alt,
        sizes
      });

      if(lightbox == true){
        img = "<light-box><div class='box'><div class='box-content'><div class='box-content-x'>x</div>" + img + caption + "</div></div>";
      }
      return img;
    }

    // get metadata
    let metadata = await Image(src, options);
  
    let img = Image.generateHTML(metadata, imageAttributes);
  
    if(lightbox == true){
      img = "<light-box><div class='box'><div class='box-content'><div class='box-content-x'>x</div>" + img + caption + "</div></div>";
    }
    return img;
  }



  async function getMediaInfo(media) {

    if(media.id == null ) return;
  
    let fileInfo = await Marbas.getFileInfo(media.id);
  
    media.format = "";
  
    if (fileInfo.yield.mimeType != undefined) {
      media.mimeType=fileInfo.yield.mimeType;
  
      switch (fileInfo.yield.mimeType) {
        case "image/jpeg":
          media.format = "jpg";
          break;
        case "image/png":
          media.format = "png";
          break;
        case "video/mp4":
          media.format = "mp4";
          break;
        case "video/webm":
          media.format = "webm";
          break;
        default:
          media.format = "unknown";
      }
      media.path = `/files/test_${media.id}.${media.format}`;
    }
  }

/**
 * gets all Information for a Video
 * @param {*} id 
 * @returns 
 */

// async function getVideo (id) {

//     if(id==undefined) return "";
  
//     let videoTrait = await Marbas.getTrait(id);
  
//     TmEleventyFs.createDir("./public/files");
  
//     var media = {
//       webm:{
//         id:videoTrait.yield.VideoWebM != undefined ? videoTrait.yield.VideoWebM[0].value : null
//       },
//       mp4:{
//         id:videoTrait.yield.VideoMP4 != undefined ? videoTrait.yield.VideoMP4[0].value : null
//       },
//       poster:{
//         id:videoTrait.yield.PosterImage != undefined ? videoTrait.yield.PosterImage[0].value : null
//       },
//       description: videoTrait.yield.Description != undefined ? videoTrait.yield.Description[0].value : "",
//       source : videoTrait.yield.Source != undefined ? videoTrait.yield.Source[0].value : "",
//       descriptionEasyLanguage :  videoTrait.yield.DescriptionEasyLanguage != undefined ? videoTrait.yield.DescriptionEasyLanguage[0].value : ""
//     }
  
  
//     await getMediaInfo(media.webm);
//     await getMediaInfo(media.mp4);
//     await getMediaInfo(media.poster);
  
  
//     await Marbas.downloadFile(media.webm.id, media.webm.path);
//     await Marbas.downloadFile(media.mp4.id, media.mp4.path);
//     await Marbas.downloadFile(media.poster.id, media.poster.path);
  
//     //console.dir(media);
  
//     return media;
//   }

/**
 * get Media of Type Image
 * 
 * obsolet
 * 
 */
// async function getMediaImage(id, mediaOptions){

//     if(id==undefined){
//       return "";
//     } 
  
//     var alt = "";
//     var widths = [400,600,800,1100,1400];
//     var sizes = "";//"(max-width: 576px) 576px, (max-width: 768px) 768px, (max-width: 992px) 992px, (max-width: 1200px) 400px, (max-width: 1400px) 467px, 600px"
  
//     if(mediaOptions != undefined &&  mediaOptions.sizes != undefined){
//       sizes  = getMediaSizes(mediaOptions.sizes, mediaOptions.placeholder_sizes);
//       widths = getMediaWidths(mediaOptions.sizes, mediaOptions.placeholder_sizes);
//     }
  
//     let imageTrait = await Marbas.getTrait(id);
  
  
//     var media = {
//       image:{
//         id:imageTrait.yield.Image != undefined ? imageTrait.yield.Image[0].value : null
//       },
//       enableImageEnlargement: imageTrait.yield.EnableImageEnlargement != undefined ? imageTrait.yield.EnableImageEnlargement[0].value : false,
//       caption: mediaOptions.caption != undefined ? mediaOptions.caption : "",
//       alt: imageTrait.yield.AltText != undefined ? imageTrait.yield.AltText[0].value : "",
//       description: imageTrait.yield.Description != undefined ? imageTrait.yield.Description[0].value : "",
//       source : imageTrait.yield.Source != undefined ? imageTrait.yield.Source[0].value : "",
//       copyright :  imageTrait.yield.Copyright != undefined ? imageTrait.yield.Copyright[0].value : ""
//     }
  
//     if(media.image.id == null) return;
//     await getMediaInfo(media.image);
  
//     let src = `${MarbasConf.marbasDomain}${MarbasConf.marbasPathApi}File/${media.image.id}/Attachment`;
  
//     // get metadata
//     let imageOptions = getImageOptions(widths, sizes)
//     let imageAttributes = getImageAttributes(alt, sizes)
//     let pictureAttributes = getPictureAttributes();
  
//     media.metadata = await Image(src, imageOptions);
  
//     let img = Image.generateHTML(media.metadata, imageAttributes, pictureAttributes);
//     //let img = await renderPictureHtml(alt,"",metadata,sizes, imageOptions.formats);
  
//     var caption = "";
//     var modalimage = "";
//     var modalImageFooter = "";
//     var modalImageCopyright = "";
  
//     if(media.enableImageEnlargement == true){
  
  
//       modalImageFooter = `<div class="image-footer">
//                             <div class="image-caption">
//                                 ${media.caption}
//                             </div>                
//                             ${modalImageCopyright}
//                           </div>
//                           `;
  
//       modalimage = `<div class="box">
//                       <div class="box-content csol-hidden">
//                         <div class="box-content-x"><div class="close"><span class="close_cross">&times;</span></div></div>
//                         ${img} 
//                         ${modalImageFooter}
//                       </div>
//                     </div>`;
//       if(media.copyright != ""){
//         modalImageCopyright = `<div class="image-copyright">
//             ${media.copyright}
//           </div>`;
                
  
//       }
//     }
  
//     img = "<csol-image><div class='image'>" + img + caption + "</div>"+ modalimage +"</csol-image>";
//     media.html = img;
//     //console.dir(media);
  
//     return media;
//   }

  /**
 * get Media of Type Image
 */
// async function getMediaImage2(media, path, mediaOptions, fetchOptions, outputDir){
  
//     var alt = media.alt != "" ? media.alt : "";
//     var widths = [400,600,800,1100,1400];
//     var sizes = ""; //"(max-width: 576px) 576px, (max-width: 768px) 768px, (max-width: 992px) 992px, (max-width: 1200px) 400px, (max-width: 1400px) 467px, 600px"
  
//     if(mediaOptions != undefined &&  mediaOptions.sizes != undefined){
//       sizes  = getMediaSizes(mediaOptions.sizes, mediaOptions.placeholder_sizes);
//       widths = getMediaWidths(mediaOptions.sizes, mediaOptions.placeholder_sizes);
//     }
    
//     // get metadata
//     let imageOptions = getImageOptions(widths, sizes, fetchOptions, outputDir)
//     let imageAttributes = getImageAttributes(alt, sizes);
//     let pictureAttributes = getPictureAttributes();
    
//     try {
//       media.metadata = await Image(path, imageOptions);
//     } catch (error) {
//       console.log("=========================>");
//       console.log(path);
//       console.dir(imageOptions);
      
//       console.log(error)
//       //console.dir(media.metadata);
//       console.log("<=========================");
//       return "";
//     }
//     let img = Image.generateHTML(media.metadata, imageAttributes, pictureAttributes);
  
//     var caption = "";
//     var modalimage = "";
//     var modalImageFooter = "";
//     var modalImageCopyright = "";
  
//     if(media.enableImageEnlargement == true){
  
  
//       modalImageFooter = `<div class="image-footer">
//                             <div class="image-caption">
//                                 ${media.caption}
//                             </div>                
//                             ${modalImageCopyright}
//                           </div>
//                           `;
  
//       modalimage = `<div class="box">
//                       <div class="box-content csol-hidden">
//                         <div class="box-content-x"><div class="close"><span class="close_cross">&times;</span></div></div>
//                         ${img} 
//                         ${modalImageFooter}
//                       </div>
//                     </div>`;

//       if(media.copyright != ""){
//         modalImageCopyright = `<div class="image-copyright">
//             ${media.copyright}
//           </div>`;
//       }
//     }
  
//     const img_return = `<csol-image data_is_modal='${media.enableImageEnlargement}'><div class='image'>${img}${caption}</div>${modalimage}</csol-image>`;
//     media.html = img_return;

//     return media;
//   }

  /**
 * get Media of Type Image
 */
  async function getMediaImage3(media, path, mediaOptions, fetchOptions, outputDir){
  
    var alt = media.alt != "" ? media.alt : "";
    var widths = [400,600,800,1100,1400];
    var sizes = ""; //"(max-width: 576px) 576px, (max-width: 768px) 768px, (max-width: 992px) 992px, (max-width: 1200px) 400px, (max-width: 1400px) 467px, 600px"
  
    if(mediaOptions != undefined &&  mediaOptions.sizes != undefined){
      sizes  = getMediaSizes(mediaOptions.sizes, mediaOptions.placeholder_sizes);
      widths = getMediaWidths(mediaOptions.sizes, mediaOptions.placeholder_sizes);
    }
    //{"sizes":[12,12,12,12,12,12], "placeholder_sizes":[12,12,12,12,12,12]}

    // get metadata
    let imageOptions = getImageOptions(widths, sizes, fetchOptions, outputDir)
    let imageAttributes = getImageAttributes(alt, sizes);
    let pictureAttributes = getPictureAttributes();

    if (bypassImageProcessing) {
      const img = createFallbackImageHtml({
        src: path,
        alt,
        sizes
      });
      const modal_img = media.enableImageEnlargement == true
        ? createFallbackImageHtml({
          src: path,
          alt,
          sizes
        })
        : "";
      const showModalImage = media.enableImageEnlargement == true ? "modal-enabled" : "modal-disabled";
      const img_return = `<responsive-image-modal3 test='${media.enableImageEnlargement}' ${showModalImage}><div slot="image">${img}</div><div slot="modal-image">${modal_img}</div></responsive-image-modal3>`;
      media.html = img_return;
      return media;
    }
    
    try {
      media.metadata = await Image(path, imageOptions);
    } catch (error) {
      console.log("=========================>");
      console.log(path);
      console.dir(imageOptions);      
      console.log(error)
      console.log("<=========================");
      return "";
    }
    let img = Image.generateHTML(media.metadata, imageAttributes, pictureAttributes);
  
    var caption = "";
    var modalimage = "";
    var modalImageFooter = "";
    var modalImageCopyright = "";
    var modal_img = "";
    var modal_sizes = "";
    var modal_widths = "";
    if(media.enableImageEnlargement == true){
      modal_sizes  = getMediaSizes(mediaOptions.sizes, mediaOptions.placeholder_sizes);
      modal_widths = getMediaWidths(mediaOptions.sizes, mediaOptions.placeholder_sizes);
      let modal_imageOptions = getImageOptions(modal_widths, modal_sizes, fetchOptions, outputDir);
      try {
        const modal_image_metadata = await Image(path, modal_imageOptions);
        modal_img = Image.generateHTML(modal_image_metadata, imageAttributes, pictureAttributes);
      } catch (error) {
        console.log("=========================>");
        console.log(path);
        console.dir(modal_imageOptions);      
        console.log(error)
        console.log("<=========================");
        return "";
      }
    }

    const showModalImage = media.enableImageEnlargement == true ? "modal-enabled" : "modal-disabled";

    const img_return = `<responsive-image-modal3 test='${media.enableImageEnlargement}' ${showModalImage}><div slot="image">${img}</div><div slot="modal-image">${modal_img}</div></responsive-image-modal3>`;
    media.html = img_return;

    return media;
  }


  var maxPageWidth = 1400;
  var widthS = 576; // max width
  var widthSM = 768; // max width
  var widthMD = 992; // max width
  var widthLG = 1200; // max width
  var widthXL = 1400; // max width
  var widthXXL = 2400; // max width
  
  
  function getMediaSizes(columnsForEachBreakpoint, placeholderColumnsForEachBreakpoint){
    //console.log("getMediaSizes: " + columnsForEachBreakpoint);
    //var sizes = `(max-width: ${widthS}px) ${~~widthS/12*columnsForEachBreakpoint[0]}px, (max-width: ${widthSM}px) ${~~widthSM/12*columnsForEachBreakpoint[1]}px, (max-width: ${widthMD}px) ${~~widthMD/12*columnsForEachBreakpoint[2]}px, (max-width: ${widthLG}px) ${~~widthLG/12*columnsForEachBreakpoint[3]}px, (max-width: ${widthXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, (max-width: ${widthXXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, ${~~widthS/12*columnsForEachBreakpoint[0]}px`;
    //var sizes = `(min-width: ${widthS}px) ${~~widthS/12*columnsForEachBreakpoint[0]}px, (min-width: ${widthSM}px) ${~~widthSM/12*columnsForEachBreakpoint[1]}px, (min-width: ${widthMD}px) ${~~widthMD/12*columnsForEachBreakpoint[2]}px, (min-width: ${widthLG}px) ${~~widthLG/12*columnsForEachBreakpoint[3]}px, (min-width: ${widthXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, (min-width: ${widthXXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, ${~~widthS/12*columnsForEachBreakpoint[0]}px`;
    //var sizes = `(min-width: ${widthXXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, (min-width: ${widthXL}px) ${~~widthXL/12*columnsForEachBreakpoint[4]}px, (min-width: ${widthLG}px) ${~~widthLG/12*columnsForEachBreakpoint[3]}px, (min-width: ${widthMD}px) ${~~widthMD/12*columnsForEachBreakpoint[2]}px, (min-width: ${widthSM}px) ${~~widthSM/12*columnsForEachBreakpoint[1]}px, (min-width: ${widthS}px) ${~~widthS/12*columnsForEachBreakpoint[0]}px, ${~~widthS/12*columnsForEachBreakpoint[0]}px`;
    var sizes = `((min-width: 100px) and (max-width: ${widthS}px)) ${~~widthS/12*columnsForEachBreakpoint[0]}px, ((min-width: ${widthS}px) and (max-width: ${widthSM}px)) ${~~widthSM/12*columnsForEachBreakpoint[0]}px, ((min-width: ${widthSM}px) and (max-width: ${widthMD}px)) ${~~widthMD/12*columnsForEachBreakpoint[1]}px, ((min-width: ${widthMD}px) and (max-width: ${widthLG}px)) ${~~widthLG/12*columnsForEachBreakpoint[2]}px, ((min-width: ${widthLG}px) and (max-width: ${widthXL}px)) ${~~widthXL/12*columnsForEachBreakpoint[3]}px, ((min-width: ${widthXL}px) and (max-width: ${widthXXL}px)) ${~~widthXXL/12*columnsForEachBreakpoint[4]}px, ${~~widthS/12*columnsForEachBreakpoint[0]}px`;
    //console.log(sizes);
    return sizes;
  }
  
  function getMediaWidths(columnsForEachBreakpoint, placeholderColumnsForEachBreakpoint){
    //console.log("getMediaWidths: " + columnsForEachBreakpoint);
    var widths = [~~widthS/12*columnsForEachBreakpoint[0], 
                  ~~widthSM/12*columnsForEachBreakpoint[1], 
                  ~~widthMD/12*columnsForEachBreakpoint[2], 
                  ~~widthLG/12*columnsForEachBreakpoint[3], 
                  ~~widthXL/12*columnsForEachBreakpoint[4], 
                  ~~widthXXL/12*columnsForEachBreakpoint[4], 
                  1400];
    //console.log(widths);
    return widths;
  }



  function getPictureAttributes() {
    return {
      pictureAttributes: {},
  
      // Condense HTML output to one line (no new lines)
      // Added in v0.7.3
      whitespaceMode: "inline",
    };
  }
  
  function getImageAttributes(alt, sizes) {
    return {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };
  }
  
  function getImageOptions(widths, sizes, fetchOptions, outputDir) {

    if(outputDir != ""){
        outputDir = `${outputDir}/`;
    }
    outputDir = `./${outputDir}/images/`;

    return {
      cacheOptions: {
        // if a remote image URL, this is the amount of time before it fetches a fresh copy
        duration: "1d",
        // project-relative path to the cache directory
        directory: ".cache",
        removeUrlQueryParams: false,
        fetchOptions: fetchOptions
      },
      widths: widths,
      sizes: sizes,
      formats: ['webp', 'jpeg'],
      urlPath: "/images/",
      outputDir: outputDir,
      filenameFormat: function (id, src, width, format, imageOptions) {
        return `${id}-${width}w.${format}`;
      }
    };
  }
  






/**
 * 
 * @param {*} src 
 * @param {*} alt 
 * @param {*} className 
 * @param {*} columns 
 * @param {*} formats 
 * @returns 
 */
const renderImageResponsive = async (
    src,
    alt,
    className = undefined,
    columns = [12,12,12,12,12],
    formats = ['webp', 'jpeg'],
  ) => {
    let sizes = getMediaSizes(columns);
    let widths = getMediaWidths(columns);
    return renderPictureHtml(src,alt,className,widths,formats,sizes);
  }
  
  
  /** Maps a config of attribute-value pairs to an HTML string
   * representing those same attribute-value pairs.
   */
  const stringifyAttributes = (attributeMap) => {
    return Object.entries(attributeMap)
      .map(([attribute, value]) => {
        if (typeof value === 'undefined') return '';
        return `${attribute}="${value}"`;
      })
      .join(' ');
  };
  
  
  /**
   * 
   * @param {*} src 
   * @param {*} alt 
   * @param {*} className 
   * @param {*} imageMetadata 
   * @returns 
   */
  
  const renderPictureHtml = async (
    alt,
    className = undefined,
    imageMetadata,
    sizes,
    formats
  ) => {
  
  
    const sourceHtmlString = Object.values(imageMetadata)
      // Map each format to the source HTML markup
      .map((images) => {
        // The first entry is representative of all the others
        // since they each have the same shape
        const { sourceType } = images[0];
  
        // Use our util from earlier to make our lives easier
        const sourceAttributes = stringifyAttributes({
          type: sourceType,
          // srcset needs to be a comma-separated attribute
          srcset: images.map((image) => image.srcset).join(', ') + "",
          sizes,
        });
  
        // Return one <source> per format
        return `<source ${sourceAttributes}>`;
      })
      .join('\n');
  
    const getLargestImage = (format) => {
      const images = imageMetadata[format];
      //return images[images.length - 1];
      return images[0];
    }
  
    const largestUnoptimizedImg = getLargestImage(formats[0]);
    const imgAttributes = stringifyAttributes({
      src: largestUnoptimizedImg.url,
      width: largestUnoptimizedImg.width,
      height: largestUnoptimizedImg.height,
      alt,
      loading: 'lazy',
      decoding: 'async',
    });
    const imgHtmlString = `<img ${imgAttributes}>`;
  
    const pictureAttributes = stringifyAttributes({
      class: className,
    });
    const picture = `<picture ${pictureAttributes}>
      ${sourceHtmlString}
      ${imgHtmlString}
    </picture>`;
  
    return outdent`${picture}`;
  };





  

  //module.exports = { getMediaImageAsHTML, getMediaInfo, getMediaImage2, getMediaImage3 };
  export { getMediaImageAsHTML, getMediaInfo, getMediaImage3 }; 
