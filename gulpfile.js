const gulp = require('gulp');
const comments = require('gulp-comments');
const ghpages = require('gh-pages');

gulp.task('comments', function()
{
    return gulp.src('src/**/*.{ts,js}')
        .pipe(comments())
        .pipe(gulp.dest('.docs'));
});
