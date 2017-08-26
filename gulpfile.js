'use strict';



const gulp = require('gulp');
const path = require('path');

const rename = require('gulp-rename');
const replace = require('gulp-replace');

const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const gcmq = require('gulp-group-css-media-queries');
const autoprefixer = require('gulp-autoprefixer');

const pump = require('pump');
const uglify = require('gulp-uglify');


const svgSprite = require('gulp-svg-sprite');
const iconify = require('gulp-iconify');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
//const cssnano = require('gulp-cssnano');

//const sftp = require('gulp-sftp');

const ftp = require( 'vinyl-ftp' );
const gutil = require( 'gulp-util' );


const config = {
    src: './src/',
    dest: './build/',

};
const dir = {
    css: {
        watch: config.src + 'sass/**.*',
        src: config.src + 'sass/style.*',
        dest: './public_html/css',
    },
    icon: {
        src: config.src + 'icons',
        dest: './public_html/i',
    },
    js: {
        src: config.src + 'js/*',
        dest: config.dest + 'js',
    },
}

gulp.task('js', function() {
    return pump([
        gulp.src(dir.js.src),
        uglify(),
        gulp.dest(dir.js.dest),
    ]
  );
});

gulp.task('sass', function() { // Sass
  return gulp.src(config.css.src)
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gcmq())
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest(config.css.dest))
});

gulp.task('watch', function() {

    gulp.watch( dir.js.src, ['js'] );

});

gulp.task('img', function() {
    return gulp.src('img/*.svg')
    .pipe(svgmin({
        js2svg: {
            pretty: true
        }
    }))
    .pipe(gulp.dest('public_html/i'));

});

gulp.task('icons', function () {
	return gulp.src('icons/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
        symbol: {
            dest: '.',
            sprite: 'sprite.svg',
            bust: false,
            example: true,
            prefix: '.icon-',
            dimensions: "%s",
            render: {
                scss: {
                  dest: "../../sass/icons"
                }
            },
        },
			}
		}))
		.pipe(gulp.dest('public_html/i'));
});

gulp.task( 'deploy', function () {

  var conn = ftp.create( {
      host:     '',
      user:     '',
      password: '',
      parallel: 10,
      log:      gutil.log
  } );

  var globs = [
      'public_html/css/**',
      'public_html/i/**',
      'public_html/js/**',
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src( globs, { base: './public_html/', buffer: false } )
      .pipe( conn.newer( '/jobstoys.ru/' ) ) // only upload newer files
      .pipe( conn.dest( '/jobstoys.ru/' ) );

} );
