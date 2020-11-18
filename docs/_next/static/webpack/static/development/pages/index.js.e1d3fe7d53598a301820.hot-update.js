webpackHotUpdate("static/development/pages/index.js",{

/***/ "./components/Resume/Experience/Experience.js":
/*!****************************************************!*\
  !*** ./components/Resume/Experience/Experience.js ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _shapes_companyShape__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../shapes/companyShape */ "./shapes/companyShape.js");
/* harmony import */ var _DateRange__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../DateRange */ "./components/Resume/DateRange/index.js");
/* harmony import */ var _Experience_scss__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./Experience.scss */ "./components/Resume/Experience/Experience.scss");
/* harmony import */ var _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(_Experience_scss__WEBPACK_IMPORTED_MODULE_11__);







var _jsxFileName = "/Users/mhuggins/Development/matthuggins.com/components/Resume/Experience/Experience.js";






var Experience =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__["default"])(Experience, _React$Component);

  function Experience() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, Experience);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(Experience)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "renderCompany", function () {
      var _this$props$company = _this.props.company,
          name = _this$props$company.name,
          url = _this$props$company.url;

      if (!url) {
        return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("span", {
          className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.detail,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 40
          },
          __self: this
        }, name);
      }

      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("a", {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.detail,
        href: url,
        target: "_blank",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 44
        },
        __self: this
      }, name);
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "renderDates", function () {
      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement(_DateRange__WEBPACK_IMPORTED_MODULE_10__["default"], {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.detail,
        start: _this.props.start,
        end: _this.props.end,
        format: {
          year: "numeric"
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 56
        },
        __self: this
      });
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "renderLocation", function () {
      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("span", {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.detail,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 67
        },
        __self: this
      }, _this.props.company.location);
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "renderPoints", function () {
      var points = _this.props.points;

      if (points.length === 0) {
        return null;
      }

      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("ul", {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 81
        },
        __self: this
      }, points.map(function (point, index) {
        return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("li", {
          key: index,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 83
          },
          __self: this
        }, point);
      }));
    });

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(Experience, [{
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("div", {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.experience,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 24
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("div", {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.role,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 25
        },
        __self: this
      }, this.props.role), react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("div", {
        className: _Experience_scss__WEBPACK_IMPORTED_MODULE_11___default.a.overview,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 26
        },
        __self: this
      }, this.renderCompany(), this.renderDates(), this.renderLocation()), this.renderPoints());
    }
  }]);

  return Experience;
}(react__WEBPACK_IMPORTED_MODULE_7___default.a.Component);

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Experience, "propTypes", {
  company: _shapes_companyShape__WEBPACK_IMPORTED_MODULE_9__["default"].isRequired,
  role: prop_types__WEBPACK_IMPORTED_MODULE_8__["string"].isRequired,
  start: Object(prop_types__WEBPACK_IMPORTED_MODULE_8__["instanceOf"])(Date).isRequired,
  end: Object(prop_types__WEBPACK_IMPORTED_MODULE_8__["instanceOf"])(Date),
  points: Object(prop_types__WEBPACK_IMPORTED_MODULE_8__["arrayOf"])(prop_types__WEBPACK_IMPORTED_MODULE_8__["string"])
});

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Experience, "defaultProps", {
  end: null,
  points: []
});

/* harmony default export */ __webpack_exports__["default"] = (Experience);

/***/ })

})
//# sourceMappingURL=index.js.e1d3fe7d53598a301820.hot-update.js.map