/**
 * Shake Table web interface - FFT implementation.
 * 
 * Port of http://www.egr.msu.edu/classes/ece480/capstone/fall11/group06/style/Application_Note_ChrisOakley.pdf
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @date 18/2/2014
 */

/**
 * Performs a FFT on the supplied data. 
 * 
 * @param {array} data data sample to perform FFT
 * @return {array} FFT sample
 */
function fft(data)
{
    var n = data.length, ff = new Array(n), d, D, e, E, k, t;
    
    if (n == 1)
    {
        ff[0] = data[0];
        return ff;
    }
    
    d = new Array(n / 2);
    e = new Array(n / 2);
    
    for (k = 0; k < n / 2; k++)
    {
        e[k] = data[2 * k];
        d[k] = data[2 * k + 1];
    }
    
    D = fft(d);
    E = fft(e);
    
    for (k = 0; k < n / 2; k++)
    {
        t = Complex.fromPolar(1, -2 * Math.PI * k / n);
        D[k] = D[k].multiply(t);
    }
    
    for (k = 0; k < n / 2; k++)
    {
       ff[k] = E[k].add(D[k]);
       ff[k + n / 2] = E[k].subtract(D[k]);
    }
    
    return ff;
}

/**
 * Complex number representation.
 * 
 * @param {Number} real real component
 * @param {Number} img imaginary component
 */
function Complex(real, img)
{
    /** @private {Number} Real component of complex number. */
    this.re = real;
    
    /** @private {Number} Imaginary component of complex number. */
    this.im = img;
}

/**
 * Gets a complex number from the polar representation.
 * 
 * @param {Number} r radius
 * @param {Number} th angle
 * @return {Complex} complex number 
 */
Complex.fromPolar = function(r, th) {
    return new Complex(r * Math.cos(th), r * Math.sin(th));
};

/**
 * Returns the real component of this complex number.
 * 
 * @return {Number} real component
 */
Complex.prototype.real = function() {
    return this.re;
};

/**
 * Returns the imaginary component of this complex number.
 * 
 * @return {Number} imaginary component 
 */
Complex.prototype.imaginary = function() {
    return this.im;
};

/**
 * Adds the specified complex number to this number, returning the result as a
 * new complex number. 
 * 
 * @param {Complex} c complex number to add
 * @return {Complex} result
 */
Complex.prototype.add = function(c) {
    return new Complex(this.re + c.real(), this.im + c.imaginary());
};

/**
 * Subtracts the specified complex number to this number, returning the result
 * as a new complex number.
 * 
 * @param {Complex} c complex number to subtract
 * @return {Complex} result
 */
Complex.prototype.subtract = function(c) {
    return new Complex(this.re - c.real(), this.im - c.imaginary());
};

/**
 * Multiplies the specified complex number with this number, returning the result
 * as a new complex number.
 * 
 * @param {Complex} c complex number to multiply
 * @return {Complex} result
 */
Complex.prototype.multiply = function(c) {
    return new Complex(this.re * c.real() - this.im * c.imaginary(), this.im * c.real() + this.re * c.imaginary());
};

/**
 * Divides this complex number with the specified complex number, returning the 
 * result as a new complex number.
 * 
 * @param {Complex} c complex number to divide with
 * @return {Complex} result
 */
Complex.prototype.divide = function(c) {
    return new Complex(
            (this.re * c.real() + this.im * c.imaginary()) / (c.real() * c.real() + c.imaginary() * c.imaginary()),
            (this.im * c.real() - this.re * c.imaginary()) / (c.real() * c.real() + c.imaginary() * c.imaginary()));
};

/**
 * Checks if the specified complex number equals this number.
 * 
 * @param {Complex} c complex number to check equality
 * @return {boolean} true if numbers equal
 */
Complex.prototype.equals = function(c) {
    return this.re == c.real() && this.im == c.imaginary();
};

/**
 * Returns the absolute value of this complex number.
 * 
 * @return {Number} absolute value
 */
Complex.prototype.abs = function() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
};
