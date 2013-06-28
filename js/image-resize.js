(function($) {
    $.fn.resizeImg = function(options) {
 
        var settings = $.extend({
            scale: 1,
            maxWidth: null,
			maxHeight: null
        }, options);
 
        return this.each(function() {
			if(this.tagName.toLowerCase() != "img") {
				// Only images can be resized
				return $(this);
			} 

			var width = this.naturalWidth;
			var height = this.naturalHeight;
			if(!width || !height) {
				// Ooops you are an IE user, let's fix it.
				var img = document.createElement('img');
				img.src = this.src;
				
				width = img.width;
				height = img.height;
			}
			
			if(settings.scale != 1) {
				width = width*settings.scale;
				height = height*settings.scale;
			}
			
			var pWidth = 1;
			if(settings.maxWidth != null) {
				pWidth = width/settings.maxWidth;
			}
			var pHeight = 1;
			if(settings.maxHeight != null) {
				pHeight = height/settings.maxHeight;
			}
			var reduce = 1;
			
			if(pWidth < pHeight) {
				reduce = pHeight;
			} else {
				reduce = pWidth;
			}
			
			if(reduce < 1) {
				reduce = 1;
			}
			
			var newWidth = parseInt(width/reduce);
			var newHeight = parseInt(height/reduce);
			
			var c = $("<canvas/>")
			c.attr('height', newHeight).attr('width', newWidth);
			$(this).after(c);
			var ctx=c[0].getContext("2d");
			ctx.drawImage($(this).get(0),0,0,newWidth, newHeight);
			// alert(c[0].toDataURL().length) // file size
			//var lowQualityJpegUrl = c[0].toDataURL('image/jpeg', 0.6);
			$(c).hide();
			if ($(".page").length > 0){
				updateRecord($(this).closest(".page"));
			}
			else if ($(".task").length > 0){
				updateRecord($(this).closest(".task"));
			}
			
			return $(this)
				.attr("width", newWidth)
				.attr("height", newHeight)
				.width(newWidth)
				.height(newHeight);
			
        });
    }
})(jQuery);