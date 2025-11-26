/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 118:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StorageService: () => (/* binding */ StorageService)
/* harmony export */ });
/* harmony import */ var _filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(250);
/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 * Supports adapter pattern for provider-specific upload implementations.
 * Each provider instance can inject its own upload adapter via the
 * 'aether.storage.service.create' filter, achieving true provider instance isolation.
 *
 */



/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} staticPath    Path for static files storage.
   * @param {Object} config        Optional configuration.
   * @param {Object} uploadAdapter Optional upload adapter with upload() method.
   */
  constructor(staticPath, config = {}, uploadAdapter = null) {
    this.staticPath = staticPath;
    this.config = config;
    this.baseUrl = config.public_url || config.base_url || '';
    this.providerId = config.provider_id || null;
    this.uploadAdapter = uploadAdapter;
  }

  /**
   * Upload a file to storage.
   *
   * Uses the upload adapter if provided, otherwise falls back to filesystem adapter.
   * This enables provider-specific upload implementations while keeping common logic
   * (manifest, dedup, etc.) in the StorageService.
   *
   * @param {string}    key      Object key/path in storage.
   * @param {File|Blob} file     File to upload.
   * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
   * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
   */
  async upload(key, file, metadata = {}) {
    if (!(file instanceof File || file instanceof Blob)) {
      return {
        success: false,
        error: 'File must be a File or Blob object'
      };
    }
    const contentType = metadata.contentType || file.type;
    try {
      let result;

      // Use upload adapter if provided (provider-specific upload)
      if (this.uploadAdapter && typeof this.uploadAdapter.upload === 'function') {
        result = await this.uploadAdapter.upload(key, file, {
          ...metadata,
          contentType
        });
      } else {
        // Default: use filesystem adapter directly
        result = await (0,_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__/* .uploadFile */ .QM)(this.staticPath, key, file, {
          contentType,
          cacheControl: metadata.cacheControl || '',
          onProgress: metadata.onProgress || null
        });
      }
      if (!result.success) {
        return result;
      }

      // Build public URL
      const url = this.getUrl(key);
      return {
        success: true,
        url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async delete(key) {
    return (0,_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__/* .deleteFile */ .Ww)(this.staticPath, key);
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy() {
    return {
      success: true
    };
  }

  /**
   * Check if a file exists in storage.
   *
   * @return {Promise<boolean>} True if exists, false otherwise.
   */
  async exists() {
    // Not implemented for local filesystem - not needed for static site generation
    return false;
  }

  /**
   * List objects in storage.
   *
   * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
   */
  async listObjects() {
    return {
      success: true,
      objects: []
    };
  }

  /**
   * Get public URL for an object.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL.
   */
  getUrl(key) {
    // Use baseUrl if available
    if (this.baseUrl) {
      return (0,_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__/* .getObjectUrl */ .vl)(this.staticPath, this.baseUrl, key);
    }
    // Return key as fallback (relative path)
    return key;
  }

  /**
   * Batch copy multiple objects in storage.
   *
   * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
   */
  async batchCopy() {
    return {
      success: true
    };
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return (0,_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__/* .batchDelete */ .yi)(this.staticPath, keys);
  }

  /**
   * Download manifest file from storage.
   *
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest() {
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    try {
      const blob = await (0,_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__/* .downloadFile */ .PE)(this.staticPath, manifestKey);
      return blob;
    } catch (error) {
      // Return null if file doesn't exist (404) or other error.
      return null;
    }
  }

  /**
   * Upload manifest file to storage.
   *
   * @param {Blob} blob Manifest blob to upload.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async uploadManifest(blob) {
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    const result = await this.upload(manifestKey, blob, {
      contentType: 'application/json'
    });
    return result;
  }
}

/***/ }),

/***/ 212:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ErrorCodes: () => (/* reexport */ ERR),
  Parser: () => (/* reexport */ Parser),
  Token: () => (/* reexport */ token_namespaceObject),
  Tokenizer: () => (/* reexport */ Tokenizer),
  TokenizerMode: () => (/* reexport */ TokenizerMode),
  defaultTreeAdapter: () => (/* reexport */ defaultTreeAdapter),
  foreignContent: () => (/* reexport */ foreign_content_namespaceObject),
  html: () => (/* reexport */ html_namespaceObject),
  parse: () => (/* binding */ parse),
  parseFragment: () => (/* binding */ parseFragment),
  serialize: () => (/* reexport */ serialize),
  serializeOuter: () => (/* reexport */ serializeOuter)
});

// NAMESPACE OBJECT: ./node_modules/parse5/dist/common/token.js
var token_namespaceObject = {};
__webpack_require__.r(token_namespaceObject);
__webpack_require__.d(token_namespaceObject, {
  TokenType: () => (TokenType),
  getTokenAttr: () => (getTokenAttr)
});

// NAMESPACE OBJECT: ./node_modules/parse5/dist/common/html.js
var html_namespaceObject = {};
__webpack_require__.r(html_namespaceObject);
__webpack_require__.d(html_namespaceObject, {
  ATTRS: () => (ATTRS),
  DOCUMENT_MODE: () => (DOCUMENT_MODE),
  NS: () => (NS),
  NUMBERED_HEADERS: () => (NUMBERED_HEADERS),
  SPECIAL_ELEMENTS: () => (SPECIAL_ELEMENTS),
  TAG_ID: () => (TAG_ID),
  TAG_NAMES: () => (TAG_NAMES),
  getTagID: () => (getTagID),
  hasUnescapedText: () => (hasUnescapedText)
});

// NAMESPACE OBJECT: ./node_modules/parse5/dist/common/foreign-content.js
var foreign_content_namespaceObject = {};
__webpack_require__.r(foreign_content_namespaceObject);
__webpack_require__.d(foreign_content_namespaceObject, {
  SVG_TAG_NAMES_ADJUSTMENT_MAP: () => (SVG_TAG_NAMES_ADJUSTMENT_MAP),
  adjustTokenMathMLAttrs: () => (adjustTokenMathMLAttrs),
  adjustTokenSVGAttrs: () => (adjustTokenSVGAttrs),
  adjustTokenSVGTagName: () => (adjustTokenSVGTagName),
  adjustTokenXMLAttrs: () => (adjustTokenXMLAttrs),
  causesExit: () => (causesExit),
  isIntegrationPoint: () => (isIntegrationPoint)
});

;// ./node_modules/parse5/dist/common/unicode.js
const UNDEFINED_CODE_POINTS = new Set([
    65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679, 393214,
    393215, 458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894,
    720895, 786430, 786431, 851966, 851967, 917502, 917503, 983038, 983039, 1048574,
    1048575, 1114110, 1114111,
]);
const REPLACEMENT_CHARACTER = '\uFFFD';
var CODE_POINTS;
(function (CODE_POINTS) {
    CODE_POINTS[CODE_POINTS["EOF"] = -1] = "EOF";
    CODE_POINTS[CODE_POINTS["NULL"] = 0] = "NULL";
    CODE_POINTS[CODE_POINTS["TABULATION"] = 9] = "TABULATION";
    CODE_POINTS[CODE_POINTS["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
    CODE_POINTS[CODE_POINTS["LINE_FEED"] = 10] = "LINE_FEED";
    CODE_POINTS[CODE_POINTS["FORM_FEED"] = 12] = "FORM_FEED";
    CODE_POINTS[CODE_POINTS["SPACE"] = 32] = "SPACE";
    CODE_POINTS[CODE_POINTS["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
    CODE_POINTS[CODE_POINTS["QUOTATION_MARK"] = 34] = "QUOTATION_MARK";
    CODE_POINTS[CODE_POINTS["AMPERSAND"] = 38] = "AMPERSAND";
    CODE_POINTS[CODE_POINTS["APOSTROPHE"] = 39] = "APOSTROPHE";
    CODE_POINTS[CODE_POINTS["HYPHEN_MINUS"] = 45] = "HYPHEN_MINUS";
    CODE_POINTS[CODE_POINTS["SOLIDUS"] = 47] = "SOLIDUS";
    CODE_POINTS[CODE_POINTS["DIGIT_0"] = 48] = "DIGIT_0";
    CODE_POINTS[CODE_POINTS["DIGIT_9"] = 57] = "DIGIT_9";
    CODE_POINTS[CODE_POINTS["SEMICOLON"] = 59] = "SEMICOLON";
    CODE_POINTS[CODE_POINTS["LESS_THAN_SIGN"] = 60] = "LESS_THAN_SIGN";
    CODE_POINTS[CODE_POINTS["EQUALS_SIGN"] = 61] = "EQUALS_SIGN";
    CODE_POINTS[CODE_POINTS["GREATER_THAN_SIGN"] = 62] = "GREATER_THAN_SIGN";
    CODE_POINTS[CODE_POINTS["QUESTION_MARK"] = 63] = "QUESTION_MARK";
    CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_A"] = 65] = "LATIN_CAPITAL_A";
    CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_Z"] = 90] = "LATIN_CAPITAL_Z";
    CODE_POINTS[CODE_POINTS["RIGHT_SQUARE_BRACKET"] = 93] = "RIGHT_SQUARE_BRACKET";
    CODE_POINTS[CODE_POINTS["GRAVE_ACCENT"] = 96] = "GRAVE_ACCENT";
    CODE_POINTS[CODE_POINTS["LATIN_SMALL_A"] = 97] = "LATIN_SMALL_A";
    CODE_POINTS[CODE_POINTS["LATIN_SMALL_Z"] = 122] = "LATIN_SMALL_Z";
})(CODE_POINTS || (CODE_POINTS = {}));
const SEQUENCES = {
    DASH_DASH: '--',
    CDATA_START: '[CDATA[',
    DOCTYPE: 'doctype',
    SCRIPT: 'script',
    PUBLIC: 'public',
    SYSTEM: 'system',
};
//Surrogates
function isSurrogate(cp) {
    return cp >= 55296 && cp <= 57343;
}
function isSurrogatePair(cp) {
    return cp >= 56320 && cp <= 57343;
}
function getSurrogatePairCodePoint(cp1, cp2) {
    return (cp1 - 55296) * 1024 + 9216 + cp2;
}
//NOTE: excluding NULL and ASCII whitespace
function isControlCodePoint(cp) {
    return ((cp !== 0x20 && cp !== 0x0a && cp !== 0x0d && cp !== 0x09 && cp !== 0x0c && cp >= 0x01 && cp <= 0x1f) ||
        (cp >= 0x7f && cp <= 0x9f));
}
function isUndefinedCodePoint(cp) {
    return (cp >= 64976 && cp <= 65007) || UNDEFINED_CODE_POINTS.has(cp);
}

;// ./node_modules/parse5/dist/common/error-codes.js
var ERR;
(function (ERR) {
    ERR["controlCharacterInInputStream"] = "control-character-in-input-stream";
    ERR["noncharacterInInputStream"] = "noncharacter-in-input-stream";
    ERR["surrogateInInputStream"] = "surrogate-in-input-stream";
    ERR["nonVoidHtmlElementStartTagWithTrailingSolidus"] = "non-void-html-element-start-tag-with-trailing-solidus";
    ERR["endTagWithAttributes"] = "end-tag-with-attributes";
    ERR["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
    ERR["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
    ERR["unexpectedNullCharacter"] = "unexpected-null-character";
    ERR["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
    ERR["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
    ERR["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
    ERR["missingEndTagName"] = "missing-end-tag-name";
    ERR["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
    ERR["unknownNamedCharacterReference"] = "unknown-named-character-reference";
    ERR["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
    ERR["unexpectedCharacterAfterDoctypeSystemIdentifier"] = "unexpected-character-after-doctype-system-identifier";
    ERR["unexpectedCharacterInUnquotedAttributeValue"] = "unexpected-character-in-unquoted-attribute-value";
    ERR["eofBeforeTagName"] = "eof-before-tag-name";
    ERR["eofInTag"] = "eof-in-tag";
    ERR["missingAttributeValue"] = "missing-attribute-value";
    ERR["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
    ERR["missingWhitespaceAfterDoctypePublicKeyword"] = "missing-whitespace-after-doctype-public-keyword";
    ERR["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] = "missing-whitespace-between-doctype-public-and-system-identifiers";
    ERR["missingWhitespaceAfterDoctypeSystemKeyword"] = "missing-whitespace-after-doctype-system-keyword";
    ERR["missingQuoteBeforeDoctypePublicIdentifier"] = "missing-quote-before-doctype-public-identifier";
    ERR["missingQuoteBeforeDoctypeSystemIdentifier"] = "missing-quote-before-doctype-system-identifier";
    ERR["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
    ERR["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
    ERR["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
    ERR["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
    ERR["cdataInHtmlContent"] = "cdata-in-html-content";
    ERR["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
    ERR["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
    ERR["eofInDoctype"] = "eof-in-doctype";
    ERR["nestedComment"] = "nested-comment";
    ERR["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
    ERR["eofInComment"] = "eof-in-comment";
    ERR["incorrectlyClosedComment"] = "incorrectly-closed-comment";
    ERR["eofInCdata"] = "eof-in-cdata";
    ERR["absenceOfDigitsInNumericCharacterReference"] = "absence-of-digits-in-numeric-character-reference";
    ERR["nullCharacterReference"] = "null-character-reference";
    ERR["surrogateCharacterReference"] = "surrogate-character-reference";
    ERR["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
    ERR["controlCharacterReference"] = "control-character-reference";
    ERR["noncharacterCharacterReference"] = "noncharacter-character-reference";
    ERR["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
    ERR["missingDoctypeName"] = "missing-doctype-name";
    ERR["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
    ERR["duplicateAttribute"] = "duplicate-attribute";
    ERR["nonConformingDoctype"] = "non-conforming-doctype";
    ERR["missingDoctype"] = "missing-doctype";
    ERR["misplacedDoctype"] = "misplaced-doctype";
    ERR["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
    ERR["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
    ERR["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
    ERR["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
    ERR["abandonedHeadElementChild"] = "abandoned-head-element-child";
    ERR["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
    ERR["nestedNoscriptInHead"] = "nested-noscript-in-head";
    ERR["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
})(ERR || (ERR = {}));

;// ./node_modules/parse5/dist/tokenizer/preprocessor.js


//Const
const DEFAULT_BUFFER_WATERLINE = 1 << 16;
//Preprocessor
//NOTE: HTML input preprocessing
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html#preprocessing-the-input-stream)
class Preprocessor {
    constructor(handler) {
        this.handler = handler;
        this.html = '';
        this.pos = -1;
        // NOTE: Initial `lastGapPos` is -2, to ensure `col` on initialisation is 0
        this.lastGapPos = -2;
        this.gapStack = [];
        this.skipNextNewLine = false;
        this.lastChunkWritten = false;
        this.endOfChunkHit = false;
        this.bufferWaterline = DEFAULT_BUFFER_WATERLINE;
        this.isEol = false;
        this.lineStartPos = 0;
        this.droppedBufferSize = 0;
        this.line = 1;
        //NOTE: avoid reporting errors twice on advance/retreat
        this.lastErrOffset = -1;
    }
    /** The column on the current line. If we just saw a gap (eg. a surrogate pair), return the index before. */
    get col() {
        return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
    }
    get offset() {
        return this.droppedBufferSize + this.pos;
    }
    getError(code, cpOffset) {
        const { line, col, offset } = this;
        const startCol = col + cpOffset;
        const startOffset = offset + cpOffset;
        return {
            code,
            startLine: line,
            endLine: line,
            startCol,
            endCol: startCol,
            startOffset,
            endOffset: startOffset,
        };
    }
    _err(code) {
        if (this.handler.onParseError && this.lastErrOffset !== this.offset) {
            this.lastErrOffset = this.offset;
            this.handler.onParseError(this.getError(code, 0));
        }
    }
    _addGap() {
        this.gapStack.push(this.lastGapPos);
        this.lastGapPos = this.pos;
    }
    _processSurrogate(cp) {
        //NOTE: try to peek a surrogate pair
        if (this.pos !== this.html.length - 1) {
            const nextCp = this.html.charCodeAt(this.pos + 1);
            if (isSurrogatePair(nextCp)) {
                //NOTE: we have a surrogate pair. Peek pair character and recalculate code point.
                this.pos++;
                //NOTE: add a gap that should be avoided during retreat
                this._addGap();
                return getSurrogatePairCodePoint(cp, nextCp);
            }
        }
        //NOTE: we are at the end of a chunk, therefore we can't infer the surrogate pair yet.
        else if (!this.lastChunkWritten) {
            this.endOfChunkHit = true;
            return CODE_POINTS.EOF;
        }
        //NOTE: isolated surrogate
        this._err(ERR.surrogateInInputStream);
        return cp;
    }
    willDropParsedChunk() {
        return this.pos > this.bufferWaterline;
    }
    dropParsedChunk() {
        if (this.willDropParsedChunk()) {
            this.html = this.html.substring(this.pos);
            this.lineStartPos -= this.pos;
            this.droppedBufferSize += this.pos;
            this.pos = 0;
            this.lastGapPos = -2;
            this.gapStack.length = 0;
        }
    }
    write(chunk, isLastChunk) {
        if (this.html.length > 0) {
            this.html += chunk;
        }
        else {
            this.html = chunk;
        }
        this.endOfChunkHit = false;
        this.lastChunkWritten = isLastChunk;
    }
    insertHtmlAtCurrentPos(chunk) {
        this.html = this.html.substring(0, this.pos + 1) + chunk + this.html.substring(this.pos + 1);
        this.endOfChunkHit = false;
    }
    startsWith(pattern, caseSensitive) {
        // Check if our buffer has enough characters
        if (this.pos + pattern.length > this.html.length) {
            this.endOfChunkHit = !this.lastChunkWritten;
            return false;
        }
        if (caseSensitive) {
            return this.html.startsWith(pattern, this.pos);
        }
        for (let i = 0; i < pattern.length; i++) {
            const cp = this.html.charCodeAt(this.pos + i) | 0x20;
            if (cp !== pattern.charCodeAt(i)) {
                return false;
            }
        }
        return true;
    }
    peek(offset) {
        const pos = this.pos + offset;
        if (pos >= this.html.length) {
            this.endOfChunkHit = !this.lastChunkWritten;
            return CODE_POINTS.EOF;
        }
        const code = this.html.charCodeAt(pos);
        return code === CODE_POINTS.CARRIAGE_RETURN ? CODE_POINTS.LINE_FEED : code;
    }
    advance() {
        this.pos++;
        //NOTE: LF should be in the last column of the line
        if (this.isEol) {
            this.isEol = false;
            this.line++;
            this.lineStartPos = this.pos;
        }
        if (this.pos >= this.html.length) {
            this.endOfChunkHit = !this.lastChunkWritten;
            return CODE_POINTS.EOF;
        }
        let cp = this.html.charCodeAt(this.pos);
        //NOTE: all U+000D CARRIAGE RETURN (CR) characters must be converted to U+000A LINE FEED (LF) characters
        if (cp === CODE_POINTS.CARRIAGE_RETURN) {
            this.isEol = true;
            this.skipNextNewLine = true;
            return CODE_POINTS.LINE_FEED;
        }
        //NOTE: any U+000A LINE FEED (LF) characters that immediately follow a U+000D CARRIAGE RETURN (CR) character
        //must be ignored.
        if (cp === CODE_POINTS.LINE_FEED) {
            this.isEol = true;
            if (this.skipNextNewLine) {
                // `line` will be bumped again in the recursive call.
                this.line--;
                this.skipNextNewLine = false;
                this._addGap();
                return this.advance();
            }
        }
        this.skipNextNewLine = false;
        if (isSurrogate(cp)) {
            cp = this._processSurrogate(cp);
        }
        //OPTIMIZATION: first check if code point is in the common allowed
        //range (ASCII alphanumeric, whitespaces, big chunk of BMP)
        //before going into detailed performance cost validation.
        const isCommonValidRange = this.handler.onParseError === null ||
            (cp > 0x1f && cp < 0x7f) ||
            cp === CODE_POINTS.LINE_FEED ||
            cp === CODE_POINTS.CARRIAGE_RETURN ||
            (cp > 0x9f && cp < 64976);
        if (!isCommonValidRange) {
            this._checkForProblematicCharacters(cp);
        }
        return cp;
    }
    _checkForProblematicCharacters(cp) {
        if (isControlCodePoint(cp)) {
            this._err(ERR.controlCharacterInInputStream);
        }
        else if (isUndefinedCodePoint(cp)) {
            this._err(ERR.noncharacterInInputStream);
        }
    }
    retreat(count) {
        this.pos -= count;
        while (this.pos < this.lastGapPos) {
            this.lastGapPos = this.gapStack.pop();
            this.pos--;
        }
        this.isEol = false;
    }
}

;// ./node_modules/parse5/dist/common/token.js
var TokenType;
(function (TokenType) {
    TokenType[TokenType["CHARACTER"] = 0] = "CHARACTER";
    TokenType[TokenType["NULL_CHARACTER"] = 1] = "NULL_CHARACTER";
    TokenType[TokenType["WHITESPACE_CHARACTER"] = 2] = "WHITESPACE_CHARACTER";
    TokenType[TokenType["START_TAG"] = 3] = "START_TAG";
    TokenType[TokenType["END_TAG"] = 4] = "END_TAG";
    TokenType[TokenType["COMMENT"] = 5] = "COMMENT";
    TokenType[TokenType["DOCTYPE"] = 6] = "DOCTYPE";
    TokenType[TokenType["EOF"] = 7] = "EOF";
    TokenType[TokenType["HIBERNATION"] = 8] = "HIBERNATION";
})(TokenType || (TokenType = {}));
function getTokenAttr(token, attrName) {
    for (let i = token.attrs.length - 1; i >= 0; i--) {
        if (token.attrs[i].name === attrName) {
            return token.attrs[i].value;
        }
    }
    return null;
}

;// ./node_modules/parse5/node_modules/entities/dist/esm/generated/decode-data-html.js
// Generated using scripts/write-decode-map.ts
const decode_data_html_htmlDecodeTree = /* #__PURE__ */ new Uint16Array(
// prettier-ignore
/* #__PURE__ */ "\u1d41<\xd5\u0131\u028a\u049d\u057b\u05d0\u0675\u06de\u07a2\u07d6\u080f\u0a4a\u0a91\u0da1\u0e6d\u0f09\u0f26\u10ca\u1228\u12e1\u1415\u149d\u14c3\u14df\u1525\0\0\0\0\0\0\u156b\u16cd\u198d\u1c12\u1ddd\u1f7e\u2060\u21b0\u228d\u23c0\u23fb\u2442\u2824\u2912\u2d08\u2e48\u2fce\u3016\u32ba\u3639\u37ac\u38fe\u3a28\u3a71\u3ae0\u3b2e\u0800EMabcfglmnoprstu\\bfms\x7f\x84\x8b\x90\x95\x98\xa6\xb3\xb9\xc8\xcflig\u803b\xc6\u40c6P\u803b&\u4026cute\u803b\xc1\u40c1reve;\u4102\u0100iyx}rc\u803b\xc2\u40c2;\u4410r;\uc000\ud835\udd04rave\u803b\xc0\u40c0pha;\u4391acr;\u4100d;\u6a53\u0100gp\x9d\xa1on;\u4104f;\uc000\ud835\udd38plyFunction;\u6061ing\u803b\xc5\u40c5\u0100cs\xbe\xc3r;\uc000\ud835\udc9cign;\u6254ilde\u803b\xc3\u40c3ml\u803b\xc4\u40c4\u0400aceforsu\xe5\xfb\xfe\u0117\u011c\u0122\u0127\u012a\u0100cr\xea\xf2kslash;\u6216\u0176\xf6\xf8;\u6ae7ed;\u6306y;\u4411\u0180crt\u0105\u010b\u0114ause;\u6235noullis;\u612ca;\u4392r;\uc000\ud835\udd05pf;\uc000\ud835\udd39eve;\u42d8c\xf2\u0113mpeq;\u624e\u0700HOacdefhilorsu\u014d\u0151\u0156\u0180\u019e\u01a2\u01b5\u01b7\u01ba\u01dc\u0215\u0273\u0278\u027ecy;\u4427PY\u803b\xa9\u40a9\u0180cpy\u015d\u0162\u017aute;\u4106\u0100;i\u0167\u0168\u62d2talDifferentialD;\u6145leys;\u612d\u0200aeio\u0189\u018e\u0194\u0198ron;\u410cdil\u803b\xc7\u40c7rc;\u4108nint;\u6230ot;\u410a\u0100dn\u01a7\u01adilla;\u40b8terDot;\u40b7\xf2\u017fi;\u43a7rcle\u0200DMPT\u01c7\u01cb\u01d1\u01d6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01e2\u01f8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020foubleQuote;\u601duote;\u6019\u0200lnpu\u021e\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6a74\u0180git\u022f\u0236\u023aruent;\u6261nt;\u622fourIntegral;\u622e\u0100fr\u024c\u024e;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6a2fcr;\uc000\ud835\udc9ep\u0100;C\u0284\u0285\u62d3ap;\u624d\u0580DJSZacefios\u02a0\u02ac\u02b0\u02b4\u02b8\u02cb\u02d7\u02e1\u02e6\u0333\u048d\u0100;o\u0179\u02a5trahd;\u6911cy;\u4402cy;\u4405cy;\u440f\u0180grs\u02bf\u02c4\u02c7ger;\u6021r;\u61a1hv;\u6ae4\u0100ay\u02d0\u02d5ron;\u410e;\u4414l\u0100;t\u02dd\u02de\u6207a;\u4394r;\uc000\ud835\udd07\u0100af\u02eb\u0327\u0100cm\u02f0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031ccute;\u40b4o\u0174\u030b\u030d;\u42d9bleAcute;\u42ddrave;\u4060ilde;\u42dcond;\u62c4ferentialD;\u6146\u0470\u033d\0\0\0\u0342\u0354\0\u0405f;\uc000\ud835\udd3b\u0180;DE\u0348\u0349\u034d\u40a8ot;\u60dcqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03cf\u03e2\u03f8ontourIntegra\xec\u0239o\u0274\u0379\0\0\u037b\xbb\u0349nArrow;\u61d3\u0100eo\u0387\u03a4ft\u0180ART\u0390\u0396\u03a1rrow;\u61d0ightArrow;\u61d4e\xe5\u02cang\u0100LR\u03ab\u03c4eft\u0100AR\u03b3\u03b9rrow;\u67f8ightArrow;\u67faightArrow;\u67f9ight\u0100AT\u03d8\u03derrow;\u61d2ee;\u62a8p\u0241\u03e9\0\0\u03efrrow;\u61d1ownArrow;\u61d5erticalBar;\u6225n\u0300ABLRTa\u0412\u042a\u0430\u045e\u047f\u037crrow\u0180;BU\u041d\u041e\u0422\u6193ar;\u6913pArrow;\u61f5reve;\u4311eft\u02d2\u043a\0\u0446\0\u0450ightVector;\u6950eeVector;\u695eector\u0100;B\u0459\u045a\u61bdar;\u6956ight\u01d4\u0467\0\u0471eeVector;\u695fector\u0100;B\u047a\u047b\u61c1ar;\u6957ee\u0100;A\u0486\u0487\u62a4rrow;\u61a7\u0100ct\u0492\u0497r;\uc000\ud835\udc9frok;\u4110\u0800NTacdfglmopqstux\u04bd\u04c0\u04c4\u04cb\u04de\u04e2\u04e7\u04ee\u04f5\u0521\u052f\u0536\u0552\u055d\u0560\u0565G;\u414aH\u803b\xd0\u40d0cute\u803b\xc9\u40c9\u0180aiy\u04d2\u04d7\u04dcron;\u411arc\u803b\xca\u40ca;\u442dot;\u4116r;\uc000\ud835\udd08rave\u803b\xc8\u40c8ement;\u6208\u0100ap\u04fa\u04fecr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65fberySmallSquare;\u65ab\u0100gp\u0526\u052aon;\u4118f;\uc000\ud835\udd3csilon;\u4395u\u0100ai\u053c\u0549l\u0100;T\u0542\u0543\u6a75ilde;\u6242librium;\u61cc\u0100ci\u0557\u055ar;\u6130m;\u6a73a;\u4397ml\u803b\xcb\u40cb\u0100ip\u056a\u056fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058d\u05b2\u05ccy;\u4424r;\uc000\ud835\udd09lled\u0253\u0597\0\0\u05a3mallSquare;\u65fcerySmallSquare;\u65aa\u0370\u05ba\0\u05bf\0\0\u05c4f;\uc000\ud835\udd3dAll;\u6200riertrf;\u6131c\xf2\u05cb\u0600JTabcdfgorst\u05e8\u05ec\u05ef\u05fa\u0600\u0612\u0616\u061b\u061d\u0623\u066c\u0672cy;\u4403\u803b>\u403emma\u0100;d\u05f7\u05f8\u4393;\u43dcreve;\u411e\u0180eiy\u0607\u060c\u0610dil;\u4122rc;\u411c;\u4413ot;\u4120r;\uc000\ud835\udd0a;\u62d9pf;\uc000\ud835\udd3eeater\u0300EFGLST\u0635\u0644\u064e\u0656\u065b\u0666qual\u0100;L\u063e\u063f\u6265ess;\u62dbullEqual;\u6267reater;\u6aa2ess;\u6277lantEqual;\u6a7eilde;\u6273cr;\uc000\ud835\udca2;\u626b\u0400Aacfiosu\u0685\u068b\u0696\u069b\u069e\u06aa\u06be\u06caRDcy;\u442a\u0100ct\u0690\u0694ek;\u42c7;\u405eirc;\u4124r;\u610clbertSpace;\u610b\u01f0\u06af\0\u06b2f;\u610dizontalLine;\u6500\u0100ct\u06c3\u06c5\xf2\u06a9rok;\u4126mp\u0144\u06d0\u06d8ownHum\xf0\u012fqual;\u624f\u0700EJOacdfgmnostu\u06fa\u06fe\u0703\u0707\u070e\u071a\u071e\u0721\u0728\u0744\u0778\u078b\u078f\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803b\xcd\u40cd\u0100iy\u0713\u0718rc\u803b\xce\u40ce;\u4418ot;\u4130r;\u6111rave\u803b\xcc\u40cc\u0180;ap\u0720\u072f\u073f\u0100cg\u0734\u0737r;\u412ainaryI;\u6148lie\xf3\u03dd\u01f4\u0749\0\u0762\u0100;e\u074d\u074e\u622c\u0100gr\u0753\u0758ral;\u622bsection;\u62c2isible\u0100CT\u076c\u0772omma;\u6063imes;\u6062\u0180gpt\u077f\u0783\u0788on;\u412ef;\uc000\ud835\udd40a;\u4399cr;\u6110ilde;\u4128\u01eb\u079a\0\u079ecy;\u4406l\u803b\xcf\u40cf\u0280cfosu\u07ac\u07b7\u07bc\u07c2\u07d0\u0100iy\u07b1\u07b5rc;\u4134;\u4419r;\uc000\ud835\udd0dpf;\uc000\ud835\udd41\u01e3\u07c7\0\u07ccr;\uc000\ud835\udca5rcy;\u4408kcy;\u4404\u0380HJacfos\u07e4\u07e8\u07ec\u07f1\u07fd\u0802\u0808cy;\u4425cy;\u440cppa;\u439a\u0100ey\u07f6\u07fbdil;\u4136;\u441ar;\uc000\ud835\udd0epf;\uc000\ud835\udd42cr;\uc000\ud835\udca6\u0580JTaceflmost\u0825\u0829\u082c\u0850\u0863\u09b3\u09b8\u09c7\u09cd\u0a37\u0a47cy;\u4409\u803b<\u403c\u0280cmnpr\u0837\u083c\u0841\u0844\u084dute;\u4139bda;\u439bg;\u67ealacetrf;\u6112r;\u619e\u0180aey\u0857\u085c\u0861ron;\u413ddil;\u413b;\u441b\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087e\u08a9\u08b1\u08e0\u08e6\u08fc\u092f\u095b\u0390\u096a\u0100nr\u0883\u088fgleBracket;\u67e8row\u0180;BR\u0899\u089a\u089e\u6190ar;\u61e4ightArrow;\u61c6eiling;\u6308o\u01f5\u08b7\0\u08c3bleBracket;\u67e6n\u01d4\u08c8\0\u08d2eeVector;\u6961ector\u0100;B\u08db\u08dc\u61c3ar;\u6959loor;\u630aight\u0100AV\u08ef\u08f5rrow;\u6194ector;\u694e\u0100er\u0901\u0917e\u0180;AV\u0909\u090a\u0910\u62a3rrow;\u61a4ector;\u695aiangle\u0180;BE\u0924\u0925\u0929\u62b2ar;\u69cfqual;\u62b4p\u0180DTV\u0937\u0942\u094cownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61bfar;\u6958ector\u0100;B\u0965\u0966\u61bcar;\u6952ight\xe1\u039cs\u0300EFGLST\u097e\u098b\u0995\u099d\u09a2\u09adqualGreater;\u62daullEqual;\u6266reater;\u6276ess;\u6aa1lantEqual;\u6a7dilde;\u6272r;\uc000\ud835\udd0f\u0100;e\u09bd\u09be\u62d8ftarrow;\u61daidot;\u413f\u0180npw\u09d4\u0a16\u0a1bg\u0200LRlr\u09de\u09f7\u0a02\u0a10eft\u0100AR\u09e6\u09ecrrow;\u67f5ightArrow;\u67f7ightArrow;\u67f6eft\u0100ar\u03b3\u0a0aight\xe1\u03bfight\xe1\u03caf;\uc000\ud835\udd43er\u0100LR\u0a22\u0a2ceftArrow;\u6199ightArrow;\u6198\u0180cht\u0a3e\u0a40\u0a42\xf2\u084c;\u61b0rok;\u4141;\u626a\u0400acefiosu\u0a5a\u0a5d\u0a60\u0a77\u0a7c\u0a85\u0a8b\u0a8ep;\u6905y;\u441c\u0100dl\u0a65\u0a6fiumSpace;\u605flintrf;\u6133r;\uc000\ud835\udd10nusPlus;\u6213pf;\uc000\ud835\udd44c\xf2\u0a76;\u439c\u0480Jacefostu\u0aa3\u0aa7\u0aad\u0ac0\u0b14\u0b19\u0d91\u0d97\u0d9ecy;\u440acute;\u4143\u0180aey\u0ab4\u0ab9\u0aberon;\u4147dil;\u4145;\u441d\u0180gsw\u0ac7\u0af0\u0b0eative\u0180MTV\u0ad3\u0adf\u0ae8ediumSpace;\u600bhi\u0100cn\u0ae6\u0ad8\xeb\u0ad9eryThi\xee\u0ad9ted\u0100GL\u0af8\u0b06reaterGreate\xf2\u0673essLes\xf3\u0a48Line;\u400ar;\uc000\ud835\udd11\u0200Bnpt\u0b22\u0b28\u0b37\u0b3areak;\u6060BreakingSpace;\u40a0f;\u6115\u0680;CDEGHLNPRSTV\u0b55\u0b56\u0b6a\u0b7c\u0ba1\u0beb\u0c04\u0c5e\u0c84\u0ca6\u0cd8\u0d61\u0d85\u6aec\u0100ou\u0b5b\u0b64ngruent;\u6262pCap;\u626doubleVerticalBar;\u6226\u0180lqx\u0b83\u0b8a\u0b9bement;\u6209ual\u0100;T\u0b92\u0b93\u6260ilde;\uc000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0bb6\u0bb7\u0bbd\u0bc9\u0bd3\u0bd8\u0be5\u626fqual;\u6271ullEqual;\uc000\u2267\u0338reater;\uc000\u226b\u0338ess;\u6279lantEqual;\uc000\u2a7e\u0338ilde;\u6275ump\u0144\u0bf2\u0bfdownHump;\uc000\u224e\u0338qual;\uc000\u224f\u0338e\u0100fs\u0c0a\u0c27tTriangle\u0180;BE\u0c1a\u0c1b\u0c21\u62eaar;\uc000\u29cf\u0338qual;\u62ecs\u0300;EGLST\u0c35\u0c36\u0c3c\u0c44\u0c4b\u0c58\u626equal;\u6270reater;\u6278ess;\uc000\u226a\u0338lantEqual;\uc000\u2a7d\u0338ilde;\u6274ested\u0100GL\u0c68\u0c79reaterGreater;\uc000\u2aa2\u0338essLess;\uc000\u2aa1\u0338recedes\u0180;ES\u0c92\u0c93\u0c9b\u6280qual;\uc000\u2aaf\u0338lantEqual;\u62e0\u0100ei\u0cab\u0cb9verseElement;\u620cghtTriangle\u0180;BE\u0ccb\u0ccc\u0cd2\u62ebar;\uc000\u29d0\u0338qual;\u62ed\u0100qu\u0cdd\u0d0cuareSu\u0100bp\u0ce8\u0cf9set\u0100;E\u0cf0\u0cf3\uc000\u228f\u0338qual;\u62e2erset\u0100;E\u0d03\u0d06\uc000\u2290\u0338qual;\u62e3\u0180bcp\u0d13\u0d24\u0d4eset\u0100;E\u0d1b\u0d1e\uc000\u2282\u20d2qual;\u6288ceeds\u0200;EST\u0d32\u0d33\u0d3b\u0d46\u6281qual;\uc000\u2ab0\u0338lantEqual;\u62e1ilde;\uc000\u227f\u0338erset\u0100;E\u0d58\u0d5b\uc000\u2283\u20d2qual;\u6289ilde\u0200;EFT\u0d6e\u0d6f\u0d75\u0d7f\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uc000\ud835\udca9ilde\u803b\xd1\u40d1;\u439d\u0700Eacdfgmoprstuv\u0dbd\u0dc2\u0dc9\u0dd5\u0ddb\u0de0\u0de7\u0dfc\u0e02\u0e20\u0e22\u0e32\u0e3f\u0e44lig;\u4152cute\u803b\xd3\u40d3\u0100iy\u0dce\u0dd3rc\u803b\xd4\u40d4;\u441eblac;\u4150r;\uc000\ud835\udd12rave\u803b\xd2\u40d2\u0180aei\u0dee\u0df2\u0df6cr;\u414cga;\u43a9cron;\u439fpf;\uc000\ud835\udd46enCurly\u0100DQ\u0e0e\u0e1aoubleQuote;\u601cuote;\u6018;\u6a54\u0100cl\u0e27\u0e2cr;\uc000\ud835\udcaaash\u803b\xd8\u40d8i\u016c\u0e37\u0e3cde\u803b\xd5\u40d5es;\u6a37ml\u803b\xd6\u40d6er\u0100BP\u0e4b\u0e60\u0100ar\u0e50\u0e53r;\u603eac\u0100ek\u0e5a\u0e5c;\u63deet;\u63b4arenthesis;\u63dc\u0480acfhilors\u0e7f\u0e87\u0e8a\u0e8f\u0e92\u0e94\u0e9d\u0eb0\u0efcrtialD;\u6202y;\u441fr;\uc000\ud835\udd13i;\u43a6;\u43a0usMinus;\u40b1\u0100ip\u0ea2\u0eadncareplan\xe5\u069df;\u6119\u0200;eio\u0eb9\u0eba\u0ee0\u0ee4\u6abbcedes\u0200;EST\u0ec8\u0ec9\u0ecf\u0eda\u627aqual;\u6aaflantEqual;\u627cilde;\u627eme;\u6033\u0100dp\u0ee9\u0eeeuct;\u620fortion\u0100;a\u0225\u0ef9l;\u621d\u0100ci\u0f01\u0f06r;\uc000\ud835\udcab;\u43a8\u0200Ufos\u0f11\u0f16\u0f1b\u0f1fOT\u803b\"\u4022r;\uc000\ud835\udd14pf;\u611acr;\uc000\ud835\udcac\u0600BEacefhiorsu\u0f3e\u0f43\u0f47\u0f60\u0f73\u0fa7\u0faa\u0fad\u1096\u10a9\u10b4\u10bearr;\u6910G\u803b\xae\u40ae\u0180cnr\u0f4e\u0f53\u0f56ute;\u4154g;\u67ebr\u0100;t\u0f5c\u0f5d\u61a0l;\u6916\u0180aey\u0f67\u0f6c\u0f71ron;\u4158dil;\u4156;\u4420\u0100;v\u0f78\u0f79\u611cerse\u0100EU\u0f82\u0f99\u0100lq\u0f87\u0f8eement;\u620builibrium;\u61cbpEquilibrium;\u696fr\xbb\u0f79o;\u43a1ght\u0400ACDFTUVa\u0fc1\u0feb\u0ff3\u1022\u1028\u105b\u1087\u03d8\u0100nr\u0fc6\u0fd2gleBracket;\u67e9row\u0180;BL\u0fdc\u0fdd\u0fe1\u6192ar;\u61e5eftArrow;\u61c4eiling;\u6309o\u01f5\u0ff9\0\u1005bleBracket;\u67e7n\u01d4\u100a\0\u1014eeVector;\u695dector\u0100;B\u101d\u101e\u61c2ar;\u6955loor;\u630b\u0100er\u102d\u1043e\u0180;AV\u1035\u1036\u103c\u62a2rrow;\u61a6ector;\u695biangle\u0180;BE\u1050\u1051\u1055\u62b3ar;\u69d0qual;\u62b5p\u0180DTV\u1063\u106e\u1078ownVector;\u694feeVector;\u695cector\u0100;B\u1082\u1083\u61bear;\u6954ector\u0100;B\u1091\u1092\u61c0ar;\u6953\u0100pu\u109b\u109ef;\u611dndImplies;\u6970ightarrow;\u61db\u0100ch\u10b9\u10bcr;\u611b;\u61b1leDelayed;\u69f4\u0680HOacfhimoqstu\u10e4\u10f1\u10f7\u10fd\u1119\u111e\u1151\u1156\u1161\u1167\u11b5\u11bb\u11bf\u0100Cc\u10e9\u10eeHcy;\u4429y;\u4428FTcy;\u442ccute;\u415a\u0280;aeiy\u1108\u1109\u110e\u1113\u1117\u6abcron;\u4160dil;\u415erc;\u415c;\u4421r;\uc000\ud835\udd16ort\u0200DLRU\u112a\u1134\u113e\u1149ownArrow\xbb\u041eeftArrow\xbb\u089aightArrow\xbb\u0fddpArrow;\u6191gma;\u43a3allCircle;\u6218pf;\uc000\ud835\udd4a\u0272\u116d\0\0\u1170t;\u621aare\u0200;ISU\u117b\u117c\u1189\u11af\u65a1ntersection;\u6293u\u0100bp\u118f\u119eset\u0100;E\u1197\u1198\u628fqual;\u6291erset\u0100;E\u11a8\u11a9\u6290qual;\u6292nion;\u6294cr;\uc000\ud835\udcaear;\u62c6\u0200bcmp\u11c8\u11db\u1209\u120b\u0100;s\u11cd\u11ce\u62d0et\u0100;E\u11cd\u11d5qual;\u6286\u0100ch\u11e0\u1205eeds\u0200;EST\u11ed\u11ee\u11f4\u11ff\u627bqual;\u6ab0lantEqual;\u627dilde;\u627fTh\xe1\u0f8c;\u6211\u0180;es\u1212\u1213\u1223\u62d1rset\u0100;E\u121c\u121d\u6283qual;\u6287et\xbb\u1213\u0580HRSacfhiors\u123e\u1244\u1249\u1255\u125e\u1271\u1276\u129f\u12c2\u12c8\u12d1ORN\u803b\xde\u40deADE;\u6122\u0100Hc\u124e\u1252cy;\u440by;\u4426\u0100bu\u125a\u125c;\u4009;\u43a4\u0180aey\u1265\u126a\u126fron;\u4164dil;\u4162;\u4422r;\uc000\ud835\udd17\u0100ei\u127b\u1289\u01f2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128e\u1298kSpace;\uc000\u205f\u200aSpace;\u6009lde\u0200;EFT\u12ab\u12ac\u12b2\u12bc\u623cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uc000\ud835\udd4bipleDot;\u60db\u0100ct\u12d6\u12dbr;\uc000\ud835\udcafrok;\u4166\u0ae1\u12f7\u130e\u131a\u1326\0\u132c\u1331\0\0\0\0\0\u1338\u133d\u1377\u1385\0\u13ff\u1404\u140a\u1410\u0100cr\u12fb\u1301ute\u803b\xda\u40dar\u0100;o\u1307\u1308\u619fcir;\u6949r\u01e3\u1313\0\u1316y;\u440eve;\u416c\u0100iy\u131e\u1323rc\u803b\xdb\u40db;\u4423blac;\u4170r;\uc000\ud835\udd18rave\u803b\xd9\u40d9acr;\u416a\u0100di\u1341\u1369er\u0100BP\u1348\u135d\u0100ar\u134d\u1350r;\u405fac\u0100ek\u1357\u1359;\u63dfet;\u63b5arenthesis;\u63ddon\u0100;P\u1370\u1371\u62c3lus;\u628e\u0100gp\u137b\u137fon;\u4172f;\uc000\ud835\udd4c\u0400ADETadps\u1395\u13ae\u13b8\u13c4\u03e8\u13d2\u13d7\u13f3rrow\u0180;BD\u1150\u13a0\u13a4ar;\u6912ownArrow;\u61c5ownArrow;\u6195quilibrium;\u696eee\u0100;A\u13cb\u13cc\u62a5rrow;\u61a5own\xe1\u03f3er\u0100LR\u13de\u13e8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13f9\u13fa\u43d2on;\u43a5ing;\u416ecr;\uc000\ud835\udcb0ilde;\u4168ml\u803b\xdc\u40dc\u0480Dbcdefosv\u1427\u142c\u1430\u1433\u143e\u1485\u148a\u1490\u1496ash;\u62abar;\u6aeby;\u4412ash\u0100;l\u143b\u143c\u62a9;\u6ae6\u0100er\u1443\u1445;\u62c1\u0180bty\u144c\u1450\u147aar;\u6016\u0100;i\u144f\u1455cal\u0200BLST\u1461\u1465\u146a\u1474ar;\u6223ine;\u407ceparator;\u6758ilde;\u6240ThinSpace;\u600ar;\uc000\ud835\udd19pf;\uc000\ud835\udd4dcr;\uc000\ud835\udcb1dash;\u62aa\u0280cefos\u14a7\u14ac\u14b1\u14b6\u14bcirc;\u4174dge;\u62c0r;\uc000\ud835\udd1apf;\uc000\ud835\udd4ecr;\uc000\ud835\udcb2\u0200fios\u14cb\u14d0\u14d2\u14d8r;\uc000\ud835\udd1b;\u439epf;\uc000\ud835\udd4fcr;\uc000\ud835\udcb3\u0480AIUacfosu\u14f1\u14f5\u14f9\u14fd\u1504\u150f\u1514\u151a\u1520cy;\u442fcy;\u4407cy;\u442ecute\u803b\xdd\u40dd\u0100iy\u1509\u150drc;\u4176;\u442br;\uc000\ud835\udd1cpf;\uc000\ud835\udd50cr;\uc000\ud835\udcb4ml;\u4178\u0400Hacdefos\u1535\u1539\u153f\u154b\u154f\u155d\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417d;\u4417ot;\u417b\u01f2\u1554\0\u155boWidt\xe8\u0ad9a;\u4396r;\u6128pf;\u6124cr;\uc000\ud835\udcb5\u0be1\u1583\u158a\u1590\0\u15b0\u15b6\u15bf\0\0\0\0\u15c6\u15db\u15eb\u165f\u166d\0\u1695\u169b\u16b2\u16b9\0\u16becute\u803b\xe1\u40e1reve;\u4103\u0300;Ediuy\u159c\u159d\u15a1\u15a3\u15a8\u15ad\u623e;\uc000\u223e\u0333;\u623frc\u803b\xe2\u40e2te\u80bb\xb4\u0306;\u4430lig\u803b\xe6\u40e6\u0100;r\xb2\u15ba;\uc000\ud835\udd1erave\u803b\xe0\u40e0\u0100ep\u15ca\u15d6\u0100fp\u15cf\u15d4sym;\u6135\xe8\u15d3ha;\u43b1\u0100ap\u15dfc\u0100cl\u15e4\u15e7r;\u4101g;\u6a3f\u0264\u15f0\0\0\u160a\u0280;adsv\u15fa\u15fb\u15ff\u1601\u1607\u6227nd;\u6a55;\u6a5clope;\u6a58;\u6a5a\u0380;elmrsz\u1618\u1619\u161b\u161e\u163f\u164f\u1659\u6220;\u69a4e\xbb\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163a\u163c\u163e;\u69a8;\u69a9;\u69aa;\u69ab;\u69ac;\u69ad;\u69ae;\u69aft\u0100;v\u1645\u1646\u621fb\u0100;d\u164c\u164d\u62be;\u699d\u0100pt\u1654\u1657h;\u6222\xbb\xb9arr;\u637c\u0100gp\u1663\u1667on;\u4105f;\uc000\ud835\udd52\u0380;Eaeiop\u12c1\u167b\u167d\u1682\u1684\u1687\u168a;\u6a70cir;\u6a6f;\u624ad;\u624bs;\u4027rox\u0100;e\u12c1\u1692\xf1\u1683ing\u803b\xe5\u40e5\u0180cty\u16a1\u16a6\u16a8r;\uc000\ud835\udcb6;\u402amp\u0100;e\u12c1\u16af\xf1\u0288ilde\u803b\xe3\u40e3ml\u803b\xe4\u40e4\u0100ci\u16c2\u16c8onin\xf4\u0272nt;\u6a11\u0800Nabcdefiklnoprsu\u16ed\u16f1\u1730\u173c\u1743\u1748\u1778\u177d\u17e0\u17e6\u1839\u1850\u170d\u193d\u1948\u1970ot;\u6aed\u0100cr\u16f6\u171ek\u0200ceps\u1700\u1705\u170d\u1713ong;\u624cpsilon;\u43f6rime;\u6035im\u0100;e\u171a\u171b\u623dq;\u62cd\u0176\u1722\u1726ee;\u62bded\u0100;g\u172c\u172d\u6305e\xbb\u172drk\u0100;t\u135c\u1737brk;\u63b6\u0100oy\u1701\u1741;\u4431quo;\u601e\u0280cmprt\u1753\u175b\u1761\u1764\u1768aus\u0100;e\u010a\u0109ptyv;\u69b0s\xe9\u170cno\xf5\u0113\u0180ahw\u176f\u1771\u1773;\u43b2;\u6136een;\u626cr;\uc000\ud835\udd1fg\u0380costuvw\u178d\u179d\u17b3\u17c1\u17d5\u17db\u17de\u0180aiu\u1794\u1796\u179a\xf0\u0760rc;\u65efp\xbb\u1371\u0180dpt\u17a4\u17a8\u17adot;\u6a00lus;\u6a01imes;\u6a02\u0271\u17b9\0\0\u17becup;\u6a06ar;\u6605riangle\u0100du\u17cd\u17d2own;\u65bdp;\u65b3plus;\u6a04e\xe5\u1444\xe5\u14adarow;\u690d\u0180ako\u17ed\u1826\u1835\u0100cn\u17f2\u1823k\u0180lst\u17fa\u05ab\u1802ozenge;\u69ebriangle\u0200;dlr\u1812\u1813\u1818\u181d\u65b4own;\u65beeft;\u65c2ight;\u65b8k;\u6423\u01b1\u182b\0\u1833\u01b2\u182f\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183e\u184d\u0100;q\u1843\u1846\uc000=\u20e5uiv;\uc000\u2261\u20e5t;\u6310\u0200ptwx\u1859\u185e\u1867\u186cf;\uc000\ud835\udd53\u0100;t\u13cb\u1863om\xbb\u13cctie;\u62c8\u0600DHUVbdhmptuv\u1885\u1896\u18aa\u18bb\u18d7\u18db\u18ec\u18ff\u1905\u190a\u1910\u1921\u0200LRlr\u188e\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18a1\u18a2\u18a4\u18a6\u18a8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18b3\u18b5\u18b7\u18b9;\u655d;\u655a;\u655c;\u6559\u0380;HLRhlr\u18ca\u18cb\u18cd\u18cf\u18d1\u18d3\u18d5\u6551;\u656c;\u6563;\u6560;\u656b;\u6562;\u655fox;\u69c9\u0200LRlr\u18e4\u18e6\u18e8\u18ea;\u6555;\u6552;\u6510;\u650c\u0280;DUdu\u06bd\u18f7\u18f9\u18fb\u18fd;\u6565;\u6568;\u652c;\u6534inus;\u629flus;\u629eimes;\u62a0\u0200LRlr\u1919\u191b\u191d\u191f;\u655b;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193b\u6502;\u656a;\u6561;\u655e;\u653c;\u6524;\u651c\u0100ev\u0123\u1942bar\u803b\xa6\u40a6\u0200ceio\u1951\u1956\u195a\u1960r;\uc000\ud835\udcb7mi;\u604fm\u0100;e\u171a\u171cl\u0180;bh\u1968\u1969\u196b\u405c;\u69c5sub;\u67c8\u016c\u1974\u197el\u0100;e\u1979\u197a\u6022t\xbb\u197ap\u0180;Ee\u012f\u1985\u1987;\u6aae\u0100;q\u06dc\u06db\u0ce1\u19a7\0\u19e8\u1a11\u1a15\u1a32\0\u1a37\u1a50\0\0\u1ab4\0\0\u1ac1\0\0\u1b21\u1b2e\u1b4d\u1b52\0\u1bfd\0\u1c0c\u0180cpr\u19ad\u19b2\u19ddute;\u4107\u0300;abcds\u19bf\u19c0\u19c4\u19ca\u19d5\u19d9\u6229nd;\u6a44rcup;\u6a49\u0100au\u19cf\u19d2p;\u6a4bp;\u6a47ot;\u6a40;\uc000\u2229\ufe00\u0100eo\u19e2\u19e5t;\u6041\xee\u0693\u0200aeiu\u19f0\u19fb\u1a01\u1a05\u01f0\u19f5\0\u19f8s;\u6a4don;\u410ddil\u803b\xe7\u40e7rc;\u4109ps\u0100;s\u1a0c\u1a0d\u6a4cm;\u6a50ot;\u410b\u0180dmn\u1a1b\u1a20\u1a26il\u80bb\xb8\u01adptyv;\u69b2t\u8100\xa2;e\u1a2d\u1a2e\u40a2r\xe4\u01b2r;\uc000\ud835\udd20\u0180cei\u1a3d\u1a40\u1a4dy;\u4447ck\u0100;m\u1a47\u1a48\u6713ark\xbb\u1a48;\u43c7r\u0380;Ecefms\u1a5f\u1a60\u1a62\u1a6b\u1aa4\u1aaa\u1aae\u65cb;\u69c3\u0180;el\u1a69\u1a6a\u1a6d\u42c6q;\u6257e\u0261\u1a74\0\0\u1a88rrow\u0100lr\u1a7c\u1a81eft;\u61baight;\u61bb\u0280RSacd\u1a92\u1a94\u1a96\u1a9a\u1a9f\xbb\u0f47;\u64c8st;\u629birc;\u629aash;\u629dnint;\u6a10id;\u6aefcir;\u69c2ubs\u0100;u\u1abb\u1abc\u6663it\xbb\u1abc\u02ec\u1ac7\u1ad4\u1afa\0\u1b0aon\u0100;e\u1acd\u1ace\u403a\u0100;q\xc7\xc6\u026d\u1ad9\0\0\u1ae2a\u0100;t\u1ade\u1adf\u402c;\u4040\u0180;fl\u1ae8\u1ae9\u1aeb\u6201\xee\u1160e\u0100mx\u1af1\u1af6ent\xbb\u1ae9e\xf3\u024d\u01e7\u1afe\0\u1b07\u0100;d\u12bb\u1b02ot;\u6a6dn\xf4\u0246\u0180fry\u1b10\u1b14\u1b17;\uc000\ud835\udd54o\xe4\u0254\u8100\xa9;s\u0155\u1b1dr;\u6117\u0100ao\u1b25\u1b29rr;\u61b5ss;\u6717\u0100cu\u1b32\u1b37r;\uc000\ud835\udcb8\u0100bp\u1b3c\u1b44\u0100;e\u1b41\u1b42\u6acf;\u6ad1\u0100;e\u1b49\u1b4a\u6ad0;\u6ad2dot;\u62ef\u0380delprvw\u1b60\u1b6c\u1b77\u1b82\u1bac\u1bd4\u1bf9arr\u0100lr\u1b68\u1b6a;\u6938;\u6935\u0270\u1b72\0\0\u1b75r;\u62dec;\u62dfarr\u0100;p\u1b7f\u1b80\u61b6;\u693d\u0300;bcdos\u1b8f\u1b90\u1b96\u1ba1\u1ba5\u1ba8\u622arcap;\u6a48\u0100au\u1b9b\u1b9ep;\u6a46p;\u6a4aot;\u628dr;\u6a45;\uc000\u222a\ufe00\u0200alrv\u1bb5\u1bbf\u1bde\u1be3rr\u0100;m\u1bbc\u1bbd\u61b7;\u693cy\u0180evw\u1bc7\u1bd4\u1bd8q\u0270\u1bce\0\0\u1bd2re\xe3\u1b73u\xe3\u1b75ee;\u62ceedge;\u62cfen\u803b\xa4\u40a4earrow\u0100lr\u1bee\u1bf3eft\xbb\u1b80ight\xbb\u1bbde\xe4\u1bdd\u0100ci\u1c01\u1c07onin\xf4\u01f7nt;\u6231lcty;\u632d\u0980AHabcdefhijlorstuwz\u1c38\u1c3b\u1c3f\u1c5d\u1c69\u1c75\u1c8a\u1c9e\u1cac\u1cb7\u1cfb\u1cff\u1d0d\u1d7b\u1d91\u1dab\u1dbb\u1dc6\u1dcdr\xf2\u0381ar;\u6965\u0200glrs\u1c48\u1c4d\u1c52\u1c54ger;\u6020eth;\u6138\xf2\u1133h\u0100;v\u1c5a\u1c5b\u6010\xbb\u090a\u016b\u1c61\u1c67arow;\u690fa\xe3\u0315\u0100ay\u1c6e\u1c73ron;\u410f;\u4434\u0180;ao\u0332\u1c7c\u1c84\u0100gr\u02bf\u1c81r;\u61catseq;\u6a77\u0180glm\u1c91\u1c94\u1c98\u803b\xb0\u40b0ta;\u43b4ptyv;\u69b1\u0100ir\u1ca3\u1ca8sht;\u697f;\uc000\ud835\udd21ar\u0100lr\u1cb3\u1cb5\xbb\u08dc\xbb\u101e\u0280aegsv\u1cc2\u0378\u1cd6\u1cdc\u1ce0m\u0180;os\u0326\u1cca\u1cd4nd\u0100;s\u0326\u1cd1uit;\u6666amma;\u43ddin;\u62f2\u0180;io\u1ce7\u1ce8\u1cf8\u40f7de\u8100\xf7;o\u1ce7\u1cf0ntimes;\u62c7n\xf8\u1cf7cy;\u4452c\u026f\u1d06\0\0\u1d0arn;\u631eop;\u630d\u0280lptuw\u1d18\u1d1d\u1d22\u1d49\u1d55lar;\u4024f;\uc000\ud835\udd55\u0280;emps\u030b\u1d2d\u1d37\u1d3d\u1d42q\u0100;d\u0352\u1d33ot;\u6251inus;\u6238lus;\u6214quare;\u62a1blebarwedg\xe5\xfan\u0180adh\u112e\u1d5d\u1d67ownarrow\xf3\u1c83arpoon\u0100lr\u1d72\u1d76ef\xf4\u1cb4igh\xf4\u1cb6\u0162\u1d7f\u1d85karo\xf7\u0f42\u026f\u1d8a\0\0\u1d8ern;\u631fop;\u630c\u0180cot\u1d98\u1da3\u1da6\u0100ry\u1d9d\u1da1;\uc000\ud835\udcb9;\u4455l;\u69f6rok;\u4111\u0100dr\u1db0\u1db4ot;\u62f1i\u0100;f\u1dba\u1816\u65bf\u0100ah\u1dc0\u1dc3r\xf2\u0429a\xf2\u0fa6angle;\u69a6\u0100ci\u1dd2\u1dd5y;\u445fgrarr;\u67ff\u0900Dacdefglmnopqrstux\u1e01\u1e09\u1e19\u1e38\u0578\u1e3c\u1e49\u1e61\u1e7e\u1ea5\u1eaf\u1ebd\u1ee1\u1f2a\u1f37\u1f44\u1f4e\u1f5a\u0100Do\u1e06\u1d34o\xf4\u1c89\u0100cs\u1e0e\u1e14ute\u803b\xe9\u40e9ter;\u6a6e\u0200aioy\u1e22\u1e27\u1e31\u1e36ron;\u411br\u0100;c\u1e2d\u1e2e\u6256\u803b\xea\u40ealon;\u6255;\u444dot;\u4117\u0100Dr\u1e41\u1e45ot;\u6252;\uc000\ud835\udd22\u0180;rs\u1e50\u1e51\u1e57\u6a9aave\u803b\xe8\u40e8\u0100;d\u1e5c\u1e5d\u6a96ot;\u6a98\u0200;ils\u1e6a\u1e6b\u1e72\u1e74\u6a99nters;\u63e7;\u6113\u0100;d\u1e79\u1e7a\u6a95ot;\u6a97\u0180aps\u1e85\u1e89\u1e97cr;\u4113ty\u0180;sv\u1e92\u1e93\u1e95\u6205et\xbb\u1e93p\u01001;\u1e9d\u1ea4\u0133\u1ea1\u1ea3;\u6004;\u6005\u6003\u0100gs\u1eaa\u1eac;\u414bp;\u6002\u0100gp\u1eb4\u1eb8on;\u4119f;\uc000\ud835\udd56\u0180als\u1ec4\u1ece\u1ed2r\u0100;s\u1eca\u1ecb\u62d5l;\u69e3us;\u6a71i\u0180;lv\u1eda\u1edb\u1edf\u43b5on\xbb\u1edb;\u43f5\u0200csuv\u1eea\u1ef3\u1f0b\u1f23\u0100io\u1eef\u1e31rc\xbb\u1e2e\u0269\u1ef9\0\0\u1efb\xed\u0548ant\u0100gl\u1f02\u1f06tr\xbb\u1e5dess\xbb\u1e7a\u0180aei\u1f12\u1f16\u1f1als;\u403dst;\u625fv\u0100;D\u0235\u1f20D;\u6a78parsl;\u69e5\u0100Da\u1f2f\u1f33ot;\u6253rr;\u6971\u0180cdi\u1f3e\u1f41\u1ef8r;\u612fo\xf4\u0352\u0100ah\u1f49\u1f4b;\u43b7\u803b\xf0\u40f0\u0100mr\u1f53\u1f57l\u803b\xeb\u40ebo;\u60ac\u0180cip\u1f61\u1f64\u1f67l;\u4021s\xf4\u056e\u0100eo\u1f6c\u1f74ctatio\xee\u0559nential\xe5\u0579\u09e1\u1f92\0\u1f9e\0\u1fa1\u1fa7\0\0\u1fc6\u1fcc\0\u1fd3\0\u1fe6\u1fea\u2000\0\u2008\u205allingdotse\xf1\u1e44y;\u4444male;\u6640\u0180ilr\u1fad\u1fb3\u1fc1lig;\u8000\ufb03\u0269\u1fb9\0\0\u1fbdg;\u8000\ufb00ig;\u8000\ufb04;\uc000\ud835\udd23lig;\u8000\ufb01lig;\uc000fj\u0180alt\u1fd9\u1fdc\u1fe1t;\u666dig;\u8000\ufb02ns;\u65b1of;\u4192\u01f0\u1fee\0\u1ff3f;\uc000\ud835\udd57\u0100ak\u05bf\u1ff7\u0100;v\u1ffc\u1ffd\u62d4;\u6ad9artint;\u6a0d\u0100ao\u200c\u2055\u0100cs\u2011\u2052\u03b1\u201a\u2030\u2038\u2045\u2048\0\u2050\u03b2\u2022\u2025\u2027\u202a\u202c\0\u202e\u803b\xbd\u40bd;\u6153\u803b\xbc\u40bc;\u6155;\u6159;\u615b\u01b3\u2034\0\u2036;\u6154;\u6156\u02b4\u203e\u2041\0\0\u2043\u803b\xbe\u40be;\u6157;\u615c5;\u6158\u01b6\u204c\0\u204e;\u615a;\u615d8;\u615el;\u6044wn;\u6322cr;\uc000\ud835\udcbb\u0880Eabcdefgijlnorstv\u2082\u2089\u209f\u20a5\u20b0\u20b4\u20f0\u20f5\u20fa\u20ff\u2103\u2112\u2138\u0317\u213e\u2152\u219e\u0100;l\u064d\u2087;\u6a8c\u0180cmp\u2090\u2095\u209dute;\u41f5ma\u0100;d\u209c\u1cda\u43b3;\u6a86reve;\u411f\u0100iy\u20aa\u20aerc;\u411d;\u4433ot;\u4121\u0200;lqs\u063e\u0642\u20bd\u20c9\u0180;qs\u063e\u064c\u20c4lan\xf4\u0665\u0200;cdl\u0665\u20d2\u20d5\u20e5c;\u6aa9ot\u0100;o\u20dc\u20dd\u6a80\u0100;l\u20e2\u20e3\u6a82;\u6a84\u0100;e\u20ea\u20ed\uc000\u22db\ufe00s;\u6a94r;\uc000\ud835\udd24\u0100;g\u0673\u061bmel;\u6137cy;\u4453\u0200;Eaj\u065a\u210c\u210e\u2110;\u6a92;\u6aa5;\u6aa4\u0200Eaes\u211b\u211d\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6a8arox\xbb\u2124\u0100;q\u212e\u212f\u6a88\u0100;q\u212e\u211bim;\u62e7pf;\uc000\ud835\udd58\u0100ci\u2143\u2146r;\u610am\u0180;el\u066b\u214e\u2150;\u6a8e;\u6a90\u8300>;cdlqr\u05ee\u2160\u216a\u216e\u2173\u2179\u0100ci\u2165\u2167;\u6aa7r;\u6a7aot;\u62d7Par;\u6995uest;\u6a7c\u0280adels\u2184\u216a\u2190\u0656\u219b\u01f0\u2189\0\u218epro\xf8\u209er;\u6978q\u0100lq\u063f\u2196les\xf3\u2088i\xed\u066b\u0100en\u21a3\u21adrtneqq;\uc000\u2269\ufe00\xc5\u21aa\u0500Aabcefkosy\u21c4\u21c7\u21f1\u21f5\u21fa\u2218\u221d\u222f\u2268\u227dr\xf2\u03a0\u0200ilmr\u21d0\u21d4\u21d7\u21dbrs\xf0\u1484f\xbb\u2024il\xf4\u06a9\u0100dr\u21e0\u21e4cy;\u444a\u0180;cw\u08f4\u21eb\u21efir;\u6948;\u61adar;\u610firc;\u4125\u0180alr\u2201\u220e\u2213rts\u0100;u\u2209\u220a\u6665it\xbb\u220alip;\u6026con;\u62b9r;\uc000\ud835\udd25s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223a\u223e\u2243\u225e\u2263rr;\u61fftht;\u623bk\u0100lr\u2249\u2253eftarrow;\u61a9ightarrow;\u61aaf;\uc000\ud835\udd59bar;\u6015\u0180clt\u226f\u2274\u2278r;\uc000\ud835\udcbdas\xe8\u21f4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xbb\u1c5b\u0ae1\u22a3\0\u22aa\0\u22b8\u22c5\u22ce\0\u22d5\u22f3\0\0\u22f8\u2322\u2367\u2362\u237f\0\u2386\u23aa\u23b4cute\u803b\xed\u40ed\u0180;iy\u0771\u22b0\u22b5rc\u803b\xee\u40ee;\u4438\u0100cx\u22bc\u22bfy;\u4435cl\u803b\xa1\u40a1\u0100fr\u039f\u22c9;\uc000\ud835\udd26rave\u803b\xec\u40ec\u0200;ino\u073e\u22dd\u22e9\u22ee\u0100in\u22e2\u22e6nt;\u6a0ct;\u622dfin;\u69dcta;\u6129lig;\u4133\u0180aop\u22fe\u231a\u231d\u0180cgt\u2305\u2308\u2317r;\u412b\u0180elp\u071f\u230f\u2313in\xe5\u078ear\xf4\u0720h;\u4131f;\u62b7ed;\u41b5\u0280;cfot\u04f4\u232c\u2331\u233d\u2341are;\u6105in\u0100;t\u2338\u2339\u621eie;\u69dddo\xf4\u2319\u0280;celp\u0757\u234c\u2350\u235b\u2361al;\u62ba\u0100gr\u2355\u2359er\xf3\u1563\xe3\u234darhk;\u6a17rod;\u6a3c\u0200cgpt\u236f\u2372\u2376\u237by;\u4451on;\u412ff;\uc000\ud835\udd5aa;\u43b9uest\u803b\xbf\u40bf\u0100ci\u238a\u238fr;\uc000\ud835\udcben\u0280;Edsv\u04f4\u239b\u239d\u23a1\u04f3;\u62f9ot;\u62f5\u0100;v\u23a6\u23a7\u62f4;\u62f3\u0100;i\u0777\u23aelde;\u4129\u01eb\u23b8\0\u23bccy;\u4456l\u803b\xef\u40ef\u0300cfmosu\u23cc\u23d7\u23dc\u23e1\u23e7\u23f5\u0100iy\u23d1\u23d5rc;\u4135;\u4439r;\uc000\ud835\udd27ath;\u4237pf;\uc000\ud835\udd5b\u01e3\u23ec\0\u23f1r;\uc000\ud835\udcbfrcy;\u4458kcy;\u4454\u0400acfghjos\u240b\u2416\u2422\u2427\u242d\u2431\u2435\u243bppa\u0100;v\u2413\u2414\u43ba;\u43f0\u0100ey\u241b\u2420dil;\u4137;\u443ar;\uc000\ud835\udd28reen;\u4138cy;\u4445cy;\u445cpf;\uc000\ud835\udd5ccr;\uc000\ud835\udcc0\u0b80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248d\u2491\u250e\u253d\u255a\u2580\u264e\u265e\u2665\u2679\u267d\u269a\u26b2\u26d8\u275d\u2768\u278b\u27c0\u2801\u2812\u0180art\u2477\u247a\u247cr\xf2\u09c6\xf2\u0395ail;\u691barr;\u690e\u0100;g\u0994\u248b;\u6a8bar;\u6962\u0963\u24a5\0\u24aa\0\u24b1\0\0\0\0\0\u24b5\u24ba\0\u24c6\u24c8\u24cd\0\u24f9ute;\u413amptyv;\u69b4ra\xee\u084cbda;\u43bbg\u0180;dl\u088e\u24c1\u24c3;\u6991\xe5\u088e;\u6a85uo\u803b\xab\u40abr\u0400;bfhlpst\u0899\u24de\u24e6\u24e9\u24eb\u24ee\u24f1\u24f5\u0100;f\u089d\u24e3s;\u691fs;\u691d\xeb\u2252p;\u61abl;\u6939im;\u6973l;\u61a2\u0180;ae\u24ff\u2500\u2504\u6aabil;\u6919\u0100;s\u2509\u250a\u6aad;\uc000\u2aad\ufe00\u0180abr\u2515\u2519\u251drr;\u690crk;\u6772\u0100ak\u2522\u252cc\u0100ek\u2528\u252a;\u407b;\u405b\u0100es\u2531\u2533;\u698bl\u0100du\u2539\u253b;\u698f;\u698d\u0200aeuy\u2546\u254b\u2556\u2558ron;\u413e\u0100di\u2550\u2554il;\u413c\xec\u08b0\xe2\u2529;\u443b\u0200cqrs\u2563\u2566\u256d\u257da;\u6936uo\u0100;r\u0e19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694bh;\u61b2\u0280;fgqs\u258b\u258c\u0989\u25f3\u25ff\u6264t\u0280ahlrt\u2598\u25a4\u25b7\u25c2\u25e8rrow\u0100;t\u0899\u25a1a\xe9\u24f6arpoon\u0100du\u25af\u25b4own\xbb\u045ap\xbb\u0966eftarrows;\u61c7ight\u0180ahs\u25cd\u25d6\u25derrow\u0100;s\u08f4\u08a7arpoon\xf3\u0f98quigarro\xf7\u21f0hreetimes;\u62cb\u0180;qs\u258b\u0993\u25falan\xf4\u09ac\u0280;cdgs\u09ac\u260a\u260d\u261d\u2628c;\u6aa8ot\u0100;o\u2614\u2615\u6a7f\u0100;r\u261a\u261b\u6a81;\u6a83\u0100;e\u2622\u2625\uc000\u22da\ufe00s;\u6a93\u0280adegs\u2633\u2639\u263d\u2649\u264bppro\xf8\u24c6ot;\u62d6q\u0100gq\u2643\u2645\xf4\u0989gt\xf2\u248c\xf4\u099bi\xed\u09b2\u0180ilr\u2655\u08e1\u265asht;\u697c;\uc000\ud835\udd29\u0100;E\u099c\u2663;\u6a91\u0161\u2669\u2676r\u0100du\u25b2\u266e\u0100;l\u0965\u2673;\u696alk;\u6584cy;\u4459\u0280;acht\u0a48\u2688\u268b\u2691\u2696r\xf2\u25c1orne\xf2\u1d08ard;\u696bri;\u65fa\u0100io\u269f\u26a4dot;\u4140ust\u0100;a\u26ac\u26ad\u63b0che\xbb\u26ad\u0200Eaes\u26bb\u26bd\u26c9\u26d4;\u6268p\u0100;p\u26c3\u26c4\u6a89rox\xbb\u26c4\u0100;q\u26ce\u26cf\u6a87\u0100;q\u26ce\u26bbim;\u62e6\u0400abnoptwz\u26e9\u26f4\u26f7\u271a\u272f\u2741\u2747\u2750\u0100nr\u26ee\u26f1g;\u67ecr;\u61fdr\xeb\u08c1g\u0180lmr\u26ff\u270d\u2714eft\u0100ar\u09e6\u2707ight\xe1\u09f2apsto;\u67fcight\xe1\u09fdparrow\u0100lr\u2725\u2729ef\xf4\u24edight;\u61ac\u0180afl\u2736\u2739\u273dr;\u6985;\uc000\ud835\udd5dus;\u6a2dimes;\u6a34\u0161\u274b\u274fst;\u6217\xe1\u134e\u0180;ef\u2757\u2758\u1800\u65cange\xbb\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277c\u2785\u2787r\xf2\u08a8orne\xf2\u1d8car\u0100;d\u0f98\u2783;\u696d;\u600eri;\u62bf\u0300achiqt\u2798\u279d\u0a40\u27a2\u27ae\u27bbquo;\u6039r;\uc000\ud835\udcc1m\u0180;eg\u09b2\u27aa\u27ac;\u6a8d;\u6a8f\u0100bu\u252a\u27b3o\u0100;r\u0e1f\u27b9;\u601arok;\u4142\u8400<;cdhilqr\u082b\u27d2\u2639\u27dc\u27e0\u27e5\u27ea\u27f0\u0100ci\u27d7\u27d9;\u6aa6r;\u6a79re\xe5\u25f2mes;\u62c9arr;\u6976uest;\u6a7b\u0100Pi\u27f5\u27f9ar;\u6996\u0180;ef\u2800\u092d\u181b\u65c3r\u0100du\u2807\u280dshar;\u694ahar;\u6966\u0100en\u2817\u2821rtneqq;\uc000\u2268\ufe00\xc5\u281e\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288e\u2893\u28a0\u28a5\u28a8\u28da\u28e2\u28e4\u0a83\u28f3\u2902Dot;\u623a\u0200clpr\u284e\u2852\u2863\u287dr\u803b\xaf\u40af\u0100et\u2857\u2859;\u6642\u0100;e\u285e\u285f\u6720se\xbb\u285f\u0100;s\u103b\u2868to\u0200;dlu\u103b\u2873\u2877\u287bow\xee\u048cef\xf4\u090f\xf0\u13d1ker;\u65ae\u0100oy\u2887\u288cmma;\u6a29;\u443cash;\u6014asuredangle\xbb\u1626r;\uc000\ud835\udd2ao;\u6127\u0180cdn\u28af\u28b4\u28c9ro\u803b\xb5\u40b5\u0200;acd\u1464\u28bd\u28c0\u28c4s\xf4\u16a7ir;\u6af0ot\u80bb\xb7\u01b5us\u0180;bd\u28d2\u1903\u28d3\u6212\u0100;u\u1d3c\u28d8;\u6a2a\u0163\u28de\u28e1p;\u6adb\xf2\u2212\xf0\u0a81\u0100dp\u28e9\u28eeels;\u62a7f;\uc000\ud835\udd5e\u0100ct\u28f8\u28fdr;\uc000\ud835\udcc2pos\xbb\u159d\u0180;lm\u2909\u290a\u290d\u43bctimap;\u62b8\u0c00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297e\u2989\u2998\u29da\u29e9\u2a15\u2a1a\u2a58\u2a5d\u2a83\u2a95\u2aa4\u2aa8\u2b04\u2b07\u2b44\u2b7f\u2bae\u2c34\u2c67\u2c7c\u2ce9\u0100gt\u2947\u294b;\uc000\u22d9\u0338\u0100;v\u2950\u0bcf\uc000\u226b\u20d2\u0180elt\u295a\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61cdightarrow;\u61ce;\uc000\u22d8\u0338\u0100;v\u297b\u0c47\uc000\u226a\u20d2ightarrow;\u61cf\u0100Dd\u298e\u2993ash;\u62afash;\u62ae\u0280bcnpt\u29a3\u29a7\u29ac\u29b1\u29ccla\xbb\u02deute;\u4144g;\uc000\u2220\u20d2\u0280;Eiop\u0d84\u29bc\u29c0\u29c5\u29c8;\uc000\u2a70\u0338d;\uc000\u224b\u0338s;\u4149ro\xf8\u0d84ur\u0100;a\u29d3\u29d4\u666el\u0100;s\u29d3\u0b38\u01f3\u29df\0\u29e3p\u80bb\xa0\u0b37mp\u0100;e\u0bf9\u0c00\u0280aeouy\u29f4\u29fe\u2a03\u2a10\u2a13\u01f0\u29f9\0\u29fb;\u6a43on;\u4148dil;\u4146ng\u0100;d\u0d7e\u2a0aot;\uc000\u2a6d\u0338p;\u6a42;\u443dash;\u6013\u0380;Aadqsx\u0b92\u2a29\u2a2d\u2a3b\u2a41\u2a45\u2a50rr;\u61d7r\u0100hr\u2a33\u2a36k;\u6924\u0100;o\u13f2\u13f0ot;\uc000\u2250\u0338ui\xf6\u0b63\u0100ei\u2a4a\u2a4ear;\u6928\xed\u0b98ist\u0100;s\u0ba0\u0b9fr;\uc000\ud835\udd2b\u0200Eest\u0bc5\u2a66\u2a79\u2a7c\u0180;qs\u0bbc\u2a6d\u0be1\u0180;qs\u0bbc\u0bc5\u2a74lan\xf4\u0be2i\xed\u0bea\u0100;r\u0bb6\u2a81\xbb\u0bb7\u0180Aap\u2a8a\u2a8d\u2a91r\xf2\u2971rr;\u61aear;\u6af2\u0180;sv\u0f8d\u2a9c\u0f8c\u0100;d\u2aa1\u2aa2\u62fc;\u62facy;\u445a\u0380AEadest\u2ab7\u2aba\u2abe\u2ac2\u2ac5\u2af6\u2af9r\xf2\u2966;\uc000\u2266\u0338rr;\u619ar;\u6025\u0200;fqs\u0c3b\u2ace\u2ae3\u2aeft\u0100ar\u2ad4\u2ad9rro\xf7\u2ac1ightarro\xf7\u2a90\u0180;qs\u0c3b\u2aba\u2aealan\xf4\u0c55\u0100;s\u0c55\u2af4\xbb\u0c36i\xed\u0c5d\u0100;r\u0c35\u2afei\u0100;e\u0c1a\u0c25i\xe4\u0d90\u0100pt\u2b0c\u2b11f;\uc000\ud835\udd5f\u8180\xac;in\u2b19\u2b1a\u2b36\u40acn\u0200;Edv\u0b89\u2b24\u2b28\u2b2e;\uc000\u22f9\u0338ot;\uc000\u22f5\u0338\u01e1\u0b89\u2b33\u2b35;\u62f7;\u62f6i\u0100;v\u0cb8\u2b3c\u01e1\u0cb8\u2b41\u2b43;\u62fe;\u62fd\u0180aor\u2b4b\u2b63\u2b69r\u0200;ast\u0b7b\u2b55\u2b5a\u2b5flle\xec\u0b7bl;\uc000\u2afd\u20e5;\uc000\u2202\u0338lint;\u6a14\u0180;ce\u0c92\u2b70\u2b73u\xe5\u0ca5\u0100;c\u0c98\u2b78\u0100;e\u0c92\u2b7d\xf1\u0c98\u0200Aait\u2b88\u2b8b\u2b9d\u2ba7r\xf2\u2988rr\u0180;cw\u2b94\u2b95\u2b99\u619b;\uc000\u2933\u0338;\uc000\u219d\u0338ghtarrow\xbb\u2b95ri\u0100;e\u0ccb\u0cd6\u0380chimpqu\u2bbd\u2bcd\u2bd9\u2b04\u0b78\u2be4\u2bef\u0200;cer\u0d32\u2bc6\u0d37\u2bc9u\xe5\u0d45;\uc000\ud835\udcc3ort\u026d\u2b05\0\0\u2bd6ar\xe1\u2b56m\u0100;e\u0d6e\u2bdf\u0100;q\u0d74\u0d73su\u0100bp\u2beb\u2bed\xe5\u0cf8\xe5\u0d0b\u0180bcp\u2bf6\u2c11\u2c19\u0200;Ees\u2bff\u2c00\u0d22\u2c04\u6284;\uc000\u2ac5\u0338et\u0100;e\u0d1b\u2c0bq\u0100;q\u0d23\u2c00c\u0100;e\u0d32\u2c17\xf1\u0d38\u0200;Ees\u2c22\u2c23\u0d5f\u2c27\u6285;\uc000\u2ac6\u0338et\u0100;e\u0d58\u2c2eq\u0100;q\u0d60\u2c23\u0200gilr\u2c3d\u2c3f\u2c45\u2c47\xec\u0bd7lde\u803b\xf1\u40f1\xe7\u0c43iangle\u0100lr\u2c52\u2c5ceft\u0100;e\u0c1a\u2c5a\xf1\u0c26ight\u0100;e\u0ccb\u2c65\xf1\u0cd7\u0100;m\u2c6c\u2c6d\u43bd\u0180;es\u2c74\u2c75\u2c79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2c8f\u2c94\u2c99\u2c9e\u2ca3\u2cb0\u2cb6\u2cd3\u2ce3ash;\u62adarr;\u6904p;\uc000\u224d\u20d2ash;\u62ac\u0100et\u2ca8\u2cac;\uc000\u2265\u20d2;\uc000>\u20d2nfin;\u69de\u0180Aet\u2cbd\u2cc1\u2cc5rr;\u6902;\uc000\u2264\u20d2\u0100;r\u2cca\u2ccd\uc000<\u20d2ie;\uc000\u22b4\u20d2\u0100At\u2cd8\u2cdcrr;\u6903rie;\uc000\u22b5\u20d2im;\uc000\u223c\u20d2\u0180Aan\u2cf0\u2cf4\u2d02rr;\u61d6r\u0100hr\u2cfa\u2cfdk;\u6923\u0100;o\u13e7\u13e5ear;\u6927\u1253\u1a95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2d2d\0\u2d38\u2d48\u2d60\u2d65\u2d72\u2d84\u1b07\0\0\u2d8d\u2dab\0\u2dc8\u2dce\0\u2ddc\u2e19\u2e2b\u2e3e\u2e43\u0100cs\u2d31\u1a97ute\u803b\xf3\u40f3\u0100iy\u2d3c\u2d45r\u0100;c\u1a9e\u2d42\u803b\xf4\u40f4;\u443e\u0280abios\u1aa0\u2d52\u2d57\u01c8\u2d5alac;\u4151v;\u6a38old;\u69bclig;\u4153\u0100cr\u2d69\u2d6dir;\u69bf;\uc000\ud835\udd2c\u036f\u2d79\0\0\u2d7c\0\u2d82n;\u42dbave\u803b\xf2\u40f2;\u69c1\u0100bm\u2d88\u0df4ar;\u69b5\u0200acit\u2d95\u2d98\u2da5\u2da8r\xf2\u1a80\u0100ir\u2d9d\u2da0r;\u69beoss;\u69bbn\xe5\u0e52;\u69c0\u0180aei\u2db1\u2db5\u2db9cr;\u414dga;\u43c9\u0180cdn\u2dc0\u2dc5\u01cdron;\u43bf;\u69b6pf;\uc000\ud835\udd60\u0180ael\u2dd4\u2dd7\u01d2r;\u69b7rp;\u69b9\u0380;adiosv\u2dea\u2deb\u2dee\u2e08\u2e0d\u2e10\u2e16\u6228r\xf2\u1a86\u0200;efm\u2df7\u2df8\u2e02\u2e05\u6a5dr\u0100;o\u2dfe\u2dff\u6134f\xbb\u2dff\u803b\xaa\u40aa\u803b\xba\u40bagof;\u62b6r;\u6a56lope;\u6a57;\u6a5b\u0180clo\u2e1f\u2e21\u2e27\xf2\u2e01ash\u803b\xf8\u40f8l;\u6298i\u016c\u2e2f\u2e34de\u803b\xf5\u40f5es\u0100;a\u01db\u2e3as;\u6a36ml\u803b\xf6\u40f6bar;\u633d\u0ae1\u2e5e\0\u2e7d\0\u2e80\u2e9d\0\u2ea2\u2eb9\0\0\u2ecb\u0e9c\0\u2f13\0\0\u2f2b\u2fbc\0\u2fc8r\u0200;ast\u0403\u2e67\u2e72\u0e85\u8100\xb6;l\u2e6d\u2e6e\u40b6le\xec\u0403\u0269\u2e78\0\0\u2e7bm;\u6af3;\u6afdy;\u443fr\u0280cimpt\u2e8b\u2e8f\u2e93\u1865\u2e97nt;\u4025od;\u402eil;\u6030enk;\u6031r;\uc000\ud835\udd2d\u0180imo\u2ea8\u2eb0\u2eb4\u0100;v\u2ead\u2eae\u43c6;\u43d5ma\xf4\u0a76ne;\u660e\u0180;tv\u2ebf\u2ec0\u2ec8\u43c0chfork\xbb\u1ffd;\u43d6\u0100au\u2ecf\u2edfn\u0100ck\u2ed5\u2eddk\u0100;h\u21f4\u2edb;\u610e\xf6\u21f4s\u0480;abcdemst\u2ef3\u2ef4\u1908\u2ef9\u2efd\u2f04\u2f06\u2f0a\u2f0e\u402bcir;\u6a23ir;\u6a22\u0100ou\u1d40\u2f02;\u6a25;\u6a72n\u80bb\xb1\u0e9dim;\u6a26wo;\u6a27\u0180ipu\u2f19\u2f20\u2f25ntint;\u6a15f;\uc000\ud835\udd61nd\u803b\xa3\u40a3\u0500;Eaceinosu\u0ec8\u2f3f\u2f41\u2f44\u2f47\u2f81\u2f89\u2f92\u2f7e\u2fb6;\u6ab3p;\u6ab7u\xe5\u0ed9\u0100;c\u0ece\u2f4c\u0300;acens\u0ec8\u2f59\u2f5f\u2f66\u2f68\u2f7eppro\xf8\u2f43urlye\xf1\u0ed9\xf1\u0ece\u0180aes\u2f6f\u2f76\u2f7approx;\u6ab9qq;\u6ab5im;\u62e8i\xed\u0edfme\u0100;s\u2f88\u0eae\u6032\u0180Eas\u2f78\u2f90\u2f7a\xf0\u2f75\u0180dfp\u0eec\u2f99\u2faf\u0180als\u2fa0\u2fa5\u2faalar;\u632eine;\u6312urf;\u6313\u0100;t\u0efb\u2fb4\xef\u0efbrel;\u62b0\u0100ci\u2fc0\u2fc5r;\uc000\ud835\udcc5;\u43c8ncsp;\u6008\u0300fiopsu\u2fda\u22e2\u2fdf\u2fe5\u2feb\u2ff1r;\uc000\ud835\udd2epf;\uc000\ud835\udd62rime;\u6057cr;\uc000\ud835\udcc6\u0180aeo\u2ff8\u3009\u3013t\u0100ei\u2ffe\u3005rnion\xf3\u06b0nt;\u6a16st\u0100;e\u3010\u3011\u403f\xf1\u1f19\xf4\u0f14\u0a80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30e0\u310e\u312b\u3147\u3162\u3172\u318e\u3206\u3215\u3224\u3229\u3258\u326e\u3272\u3290\u32b0\u32b7\u0180art\u3047\u304a\u304cr\xf2\u10b3\xf2\u03ddail;\u691car\xf2\u1c65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307f\u308f\u3094\u30cc\u0100eu\u306d\u3071;\uc000\u223d\u0331te;\u4155i\xe3\u116emptyv;\u69b3g\u0200;del\u0fd1\u3089\u308b\u308d;\u6992;\u69a5\xe5\u0fd1uo\u803b\xbb\u40bbr\u0580;abcfhlpstw\u0fdc\u30ac\u30af\u30b7\u30b9\u30bc\u30be\u30c0\u30c3\u30c7\u30cap;\u6975\u0100;f\u0fe0\u30b4s;\u6920;\u6933s;\u691e\xeb\u225d\xf0\u272el;\u6945im;\u6974l;\u61a3;\u619d\u0100ai\u30d1\u30d5il;\u691ao\u0100;n\u30db\u30dc\u6236al\xf3\u0f1e\u0180abr\u30e7\u30ea\u30eer\xf2\u17e5rk;\u6773\u0100ak\u30f3\u30fdc\u0100ek\u30f9\u30fb;\u407d;\u405d\u0100es\u3102\u3104;\u698cl\u0100du\u310a\u310c;\u698e;\u6990\u0200aeuy\u3117\u311c\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xec\u0ff2\xe2\u30fa;\u4440\u0200clqs\u3134\u3137\u313d\u3144a;\u6937dhar;\u6969uo\u0100;r\u020e\u020dh;\u61b3\u0180acg\u314e\u315f\u0f44l\u0200;ips\u0f78\u3158\u315b\u109cn\xe5\u10bbar\xf4\u0fa9t;\u65ad\u0180ilr\u3169\u1023\u316esht;\u697d;\uc000\ud835\udd2f\u0100ao\u3177\u3186r\u0100du\u317d\u317f\xbb\u047b\u0100;l\u1091\u3184;\u696c\u0100;v\u318b\u318c\u43c1;\u43f1\u0180gns\u3195\u31f9\u31fcht\u0300ahlrst\u31a4\u31b0\u31c2\u31d8\u31e4\u31eerrow\u0100;t\u0fdc\u31ada\xe9\u30c8arpoon\u0100du\u31bb\u31bfow\xee\u317ep\xbb\u1092eft\u0100ah\u31ca\u31d0rrow\xf3\u0feaarpoon\xf3\u0551ightarrows;\u61c9quigarro\xf7\u30cbhreetimes;\u62ccg;\u42daingdotse\xf1\u1f32\u0180ahm\u320d\u3210\u3213r\xf2\u0feaa\xf2\u0551;\u600foust\u0100;a\u321e\u321f\u63b1che\xbb\u321fmid;\u6aee\u0200abpt\u3232\u323d\u3240\u3252\u0100nr\u3237\u323ag;\u67edr;\u61fer\xeb\u1003\u0180afl\u3247\u324a\u324er;\u6986;\uc000\ud835\udd63us;\u6a2eimes;\u6a35\u0100ap\u325d\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6a12ar\xf2\u31e3\u0200achq\u327b\u3280\u10bc\u3285quo;\u603ar;\uc000\ud835\udcc7\u0100bu\u30fb\u328ao\u0100;r\u0214\u0213\u0180hir\u3297\u329b\u32a0re\xe5\u31f8mes;\u62cai\u0200;efl\u32aa\u1059\u1821\u32ab\u65b9tri;\u69celuhar;\u6968;\u611e\u0d61\u32d5\u32db\u32df\u332c\u3338\u3371\0\u337a\u33a4\0\0\u33ec\u33f0\0\u3428\u3448\u345a\u34ad\u34b1\u34ca\u34f1\0\u3616\0\0\u3633cute;\u415bqu\xef\u27ba\u0500;Eaceinpsy\u11ed\u32f3\u32f5\u32ff\u3302\u330b\u330f\u331f\u3326\u3329;\u6ab4\u01f0\u32fa\0\u32fc;\u6ab8on;\u4161u\xe5\u11fe\u0100;d\u11f3\u3307il;\u415frc;\u415d\u0180Eas\u3316\u3318\u331b;\u6ab6p;\u6abaim;\u62e9olint;\u6a13i\xed\u1204;\u4441ot\u0180;be\u3334\u1d47\u3335\u62c5;\u6a66\u0380Aacmstx\u3346\u334a\u3357\u335b\u335e\u3363\u336drr;\u61d8r\u0100hr\u3350\u3352\xeb\u2228\u0100;o\u0a36\u0a34t\u803b\xa7\u40a7i;\u403bwar;\u6929m\u0100in\u3369\xf0nu\xf3\xf1t;\u6736r\u0100;o\u3376\u2055\uc000\ud835\udd30\u0200acoy\u3382\u3386\u3391\u33a0rp;\u666f\u0100hy\u338b\u338fcy;\u4449;\u4448rt\u026d\u3399\0\0\u339ci\xe4\u1464ara\xec\u2e6f\u803b\xad\u40ad\u0100gm\u33a8\u33b4ma\u0180;fv\u33b1\u33b2\u33b2\u43c3;\u43c2\u0400;deglnpr\u12ab\u33c5\u33c9\u33ce\u33d6\u33de\u33e1\u33e6ot;\u6a6a\u0100;q\u12b1\u12b0\u0100;E\u33d3\u33d4\u6a9e;\u6aa0\u0100;E\u33db\u33dc\u6a9d;\u6a9fe;\u6246lus;\u6a24arr;\u6972ar\xf2\u113d\u0200aeit\u33f8\u3408\u340f\u3417\u0100ls\u33fd\u3404lsetm\xe9\u336ahp;\u6a33parsl;\u69e4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341c\u341d\u6aaa\u0100;s\u3422\u3423\u6aac;\uc000\u2aac\ufe00\u0180flp\u342e\u3433\u3442tcy;\u444c\u0100;b\u3438\u3439\u402f\u0100;a\u343e\u343f\u69c4r;\u633ff;\uc000\ud835\udd64a\u0100dr\u344d\u0402es\u0100;u\u3454\u3455\u6660it\xbb\u3455\u0180csu\u3460\u3479\u349f\u0100au\u3465\u346fp\u0100;s\u1188\u346b;\uc000\u2293\ufe00p\u0100;s\u11b4\u3475;\uc000\u2294\ufe00u\u0100bp\u347f\u348f\u0180;es\u1197\u119c\u3486et\u0100;e\u1197\u348d\xf1\u119d\u0180;es\u11a8\u11ad\u3496et\u0100;e\u11a8\u349d\xf1\u11ae\u0180;af\u117b\u34a6\u05b0r\u0165\u34ab\u05b1\xbb\u117car\xf2\u1148\u0200cemt\u34b9\u34be\u34c2\u34c5r;\uc000\ud835\udcc8tm\xee\xf1i\xec\u3415ar\xe6\u11be\u0100ar\u34ce\u34d5r\u0100;f\u34d4\u17bf\u6606\u0100an\u34da\u34edight\u0100ep\u34e3\u34eapsilo\xee\u1ee0h\xe9\u2eafs\xbb\u2852\u0280bcmnp\u34fb\u355e\u1209\u358b\u358e\u0480;Edemnprs\u350e\u350f\u3511\u3515\u351e\u3523\u352c\u3531\u3536\u6282;\u6ac5ot;\u6abd\u0100;d\u11da\u351aot;\u6ac3ult;\u6ac1\u0100Ee\u3528\u352a;\u6acb;\u628alus;\u6abfarr;\u6979\u0180eiu\u353d\u3552\u3555t\u0180;en\u350e\u3545\u354bq\u0100;q\u11da\u350feq\u0100;q\u352b\u3528m;\u6ac7\u0100bp\u355a\u355c;\u6ad5;\u6ad3c\u0300;acens\u11ed\u356c\u3572\u3579\u357b\u3326ppro\xf8\u32faurlye\xf1\u11fe\xf1\u11f3\u0180aes\u3582\u3588\u331bppro\xf8\u331aq\xf1\u3317g;\u666a\u0680123;Edehlmnps\u35a9\u35ac\u35af\u121c\u35b2\u35b4\u35c0\u35c9\u35d5\u35da\u35df\u35e8\u35ed\u803b\xb9\u40b9\u803b\xb2\u40b2\u803b\xb3\u40b3;\u6ac6\u0100os\u35b9\u35bct;\u6abeub;\u6ad8\u0100;d\u1222\u35c5ot;\u6ac4s\u0100ou\u35cf\u35d2l;\u67c9b;\u6ad7arr;\u697bult;\u6ac2\u0100Ee\u35e4\u35e6;\u6acc;\u628blus;\u6ac0\u0180eiu\u35f4\u3609\u360ct\u0180;en\u121c\u35fc\u3602q\u0100;q\u1222\u35b2eq\u0100;q\u35e7\u35e4m;\u6ac8\u0100bp\u3611\u3613;\u6ad4;\u6ad6\u0180Aan\u361c\u3620\u362drr;\u61d9r\u0100hr\u3626\u3628\xeb\u222e\u0100;o\u0a2b\u0a29war;\u692alig\u803b\xdf\u40df\u0be1\u3651\u365d\u3660\u12ce\u3673\u3679\0\u367e\u36c2\0\0\0\0\0\u36db\u3703\0\u3709\u376c\0\0\0\u3787\u0272\u3656\0\0\u365bget;\u6316;\u43c4r\xeb\u0e5f\u0180aey\u3666\u366b\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uc000\ud835\udd31\u0200eiko\u3686\u369d\u36b5\u36bc\u01f2\u368b\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369b\u43b8ym;\u43d1\u0100cn\u36a2\u36b2k\u0100as\u36a8\u36aeppro\xf8\u12c1im\xbb\u12acs\xf0\u129e\u0100as\u36ba\u36ae\xf0\u12c1rn\u803b\xfe\u40fe\u01ec\u031f\u36c6\u22e7es\u8180\xd7;bd\u36cf\u36d0\u36d8\u40d7\u0100;a\u190f\u36d5r;\u6a31;\u6a30\u0180eps\u36e1\u36e3\u3700\xe1\u2a4d\u0200;bcf\u0486\u36ec\u36f0\u36f4ot;\u6336ir;\u6af1\u0100;o\u36f9\u36fc\uc000\ud835\udd65rk;\u6ada\xe1\u3362rime;\u6034\u0180aip\u370f\u3712\u3764d\xe5\u1248\u0380adempst\u3721\u374d\u3740\u3751\u3757\u375c\u375fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65b5own\xbb\u1dbbeft\u0100;e\u2800\u373e\xf1\u092e;\u625cight\u0100;e\u32aa\u374b\xf1\u105aot;\u65ecinus;\u6a3alus;\u6a39b;\u69cdime;\u6a3bezium;\u63e2\u0180cht\u3772\u377d\u3781\u0100ry\u3777\u377b;\uc000\ud835\udcc9;\u4446cy;\u445brok;\u4167\u0100io\u378b\u378ex\xf4\u1777head\u0100lr\u3797\u37a0eftarro\xf7\u084fightarrow\xbb\u0f5d\u0900AHabcdfghlmoprstuw\u37d0\u37d3\u37d7\u37e4\u37f0\u37fc\u380e\u381c\u3823\u3834\u3851\u385d\u386b\u38a9\u38cc\u38d2\u38ea\u38f6r\xf2\u03edar;\u6963\u0100cr\u37dc\u37e2ute\u803b\xfa\u40fa\xf2\u1150r\u01e3\u37ea\0\u37edy;\u445eve;\u416d\u0100iy\u37f5\u37farc\u803b\xfb\u40fb;\u4443\u0180abh\u3803\u3806\u380br\xf2\u13adlac;\u4171a\xf2\u13c3\u0100ir\u3813\u3818sht;\u697e;\uc000\ud835\udd32rave\u803b\xf9\u40f9\u0161\u3827\u3831r\u0100lr\u382c\u382e\xbb\u0957\xbb\u1083lk;\u6580\u0100ct\u3839\u384d\u026f\u383f\0\0\u384arn\u0100;e\u3845\u3846\u631cr\xbb\u3846op;\u630fri;\u65f8\u0100al\u3856\u385acr;\u416b\u80bb\xa8\u0349\u0100gp\u3862\u3866on;\u4173f;\uc000\ud835\udd66\u0300adhlsu\u114b\u3878\u387d\u1372\u3891\u38a0own\xe1\u13b3arpoon\u0100lr\u3888\u388cef\xf4\u382digh\xf4\u382fi\u0180;hl\u3899\u389a\u389c\u43c5\xbb\u13faon\xbb\u389aparrows;\u61c8\u0180cit\u38b0\u38c4\u38c8\u026f\u38b6\0\0\u38c1rn\u0100;e\u38bc\u38bd\u631dr\xbb\u38bdop;\u630eng;\u416fri;\u65f9cr;\uc000\ud835\udcca\u0180dir\u38d9\u38dd\u38e2ot;\u62f0lde;\u4169i\u0100;f\u3730\u38e8\xbb\u1813\u0100am\u38ef\u38f2r\xf2\u38a8l\u803b\xfc\u40fcangle;\u69a7\u0780ABDacdeflnoprsz\u391c\u391f\u3929\u392d\u39b5\u39b8\u39bd\u39df\u39e4\u39e8\u39f3\u39f9\u39fd\u3a01\u3a20r\xf2\u03f7ar\u0100;v\u3926\u3927\u6ae8;\u6ae9as\xe8\u03e1\u0100nr\u3932\u3937grt;\u699c\u0380eknprst\u34e3\u3946\u394b\u3952\u395d\u3964\u3996app\xe1\u2415othin\xe7\u1e96\u0180hir\u34eb\u2ec8\u3959op\xf4\u2fb5\u0100;h\u13b7\u3962\xef\u318d\u0100iu\u3969\u396dgm\xe1\u33b3\u0100bp\u3972\u3984setneq\u0100;q\u397d\u3980\uc000\u228a\ufe00;\uc000\u2acb\ufe00setneq\u0100;q\u398f\u3992\uc000\u228b\ufe00;\uc000\u2acc\ufe00\u0100hr\u399b\u399fet\xe1\u369ciangle\u0100lr\u39aa\u39afeft\xbb\u0925ight\xbb\u1051y;\u4432ash\xbb\u1036\u0180elr\u39c4\u39d2\u39d7\u0180;be\u2dea\u39cb\u39cfar;\u62bbq;\u625alip;\u62ee\u0100bt\u39dc\u1468a\xf2\u1469r;\uc000\ud835\udd33tr\xe9\u39aesu\u0100bp\u39ef\u39f1\xbb\u0d1c\xbb\u0d59pf;\uc000\ud835\udd67ro\xf0\u0efbtr\xe9\u39b4\u0100cu\u3a06\u3a0br;\uc000\ud835\udccb\u0100bp\u3a10\u3a18n\u0100Ee\u3980\u3a16\xbb\u397en\u0100Ee\u3992\u3a1e\xbb\u3990igzag;\u699a\u0380cefoprs\u3a36\u3a3b\u3a56\u3a5b\u3a54\u3a61\u3a6airc;\u4175\u0100di\u3a40\u3a51\u0100bg\u3a45\u3a49ar;\u6a5fe\u0100;q\u15fa\u3a4f;\u6259erp;\u6118r;\uc000\ud835\udd34pf;\uc000\ud835\udd68\u0100;e\u1479\u3a66at\xe8\u1479cr;\uc000\ud835\udccc\u0ae3\u178e\u3a87\0\u3a8b\0\u3a90\u3a9b\0\0\u3a9d\u3aa8\u3aab\u3aaf\0\0\u3ac3\u3ace\0\u3ad8\u17dc\u17dftr\xe9\u17d1r;\uc000\ud835\udd35\u0100Aa\u3a94\u3a97r\xf2\u03c3r\xf2\u09f6;\u43be\u0100Aa\u3aa1\u3aa4r\xf2\u03b8r\xf2\u09eba\xf0\u2713is;\u62fb\u0180dpt\u17a4\u3ab5\u3abe\u0100fl\u3aba\u17a9;\uc000\ud835\udd69im\xe5\u17b2\u0100Aa\u3ac7\u3acar\xf2\u03cer\xf2\u0a01\u0100cq\u3ad2\u17b8r;\uc000\ud835\udccd\u0100pt\u17d6\u3adcr\xe9\u17d4\u0400acefiosu\u3af0\u3afd\u3b08\u3b0c\u3b11\u3b15\u3b1b\u3b21c\u0100uy\u3af6\u3afbte\u803b\xfd\u40fd;\u444f\u0100iy\u3b02\u3b06rc;\u4177;\u444bn\u803b\xa5\u40a5r;\uc000\ud835\udd36cy;\u4457pf;\uc000\ud835\udd6acr;\uc000\ud835\udcce\u0100cm\u3b26\u3b29y;\u444el\u803b\xff\u40ff\u0500acdefhiosw\u3b42\u3b48\u3b54\u3b58\u3b64\u3b69\u3b6d\u3b74\u3b7a\u3b80cute;\u417a\u0100ay\u3b4d\u3b52ron;\u417e;\u4437ot;\u417c\u0100et\u3b5d\u3b61tr\xe6\u155fa;\u43b6r;\uc000\ud835\udd37cy;\u4436grarr;\u61ddpf;\uc000\ud835\udd6bcr;\uc000\ud835\udccf\u0100jn\u3b85\u3b87;\u600dj;\u600c"
    .split("")
    .map((c) => c.charCodeAt(0)));

;// ./node_modules/parse5/node_modules/entities/dist/esm/generated/decode-data-xml.js
// Generated using scripts/write-decode-map.ts
const decode_data_xml_xmlDecodeTree = /* #__PURE__ */ new Uint16Array(
// prettier-ignore
/* #__PURE__ */ "\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022"
    .split("")
    .map((c) => c.charCodeAt(0)));

;// ./node_modules/parse5/node_modules/entities/dist/esm/decode-codepoint.js
// Adapted from https://github.com/mathiasbynens/he/blob/36afe179392226cf1b6ccdb16ebbb7a5a844d93a/src/he.js#L106-L134
var _a;
const decodeMap = new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376],
]);
/**
 * Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
 */
const decode_codepoint_fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, n/no-unsupported-features/es-builtins
(_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function (codePoint) {
    let output = "";
    if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(((codePoint >>> 10) & 1023) | 55296);
        codePoint = 56320 | (codePoint & 1023);
    }
    output += String.fromCharCode(codePoint);
    return output;
};
/**
 * Replace the given code point with a replacement character if it is a
 * surrogate or is outside the valid range. Otherwise return the code
 * point unchanged.
 */
function replaceCodePoint(codePoint) {
    var _a;
    if ((codePoint >= 55296 && codePoint <= 57343) ||
        codePoint > 1114111) {
        return 65533;
    }
    return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
}
/**
 * Replace the code point if relevant, then convert it to a string.
 *
 * @deprecated Use `fromCodePoint(replaceCodePoint(codePoint))` instead.
 * @param codePoint The code point to decode.
 * @returns The decoded code point.
 */
function decodeCodePoint(codePoint) {
    return decode_codepoint_fromCodePoint(replaceCodePoint(codePoint));
}

;// ./node_modules/parse5/node_modules/entities/dist/esm/decode.js



var CharCodes;
(function (CharCodes) {
    CharCodes[CharCodes["NUM"] = 35] = "NUM";
    CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
    CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
    CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
    CharCodes[CharCodes["NINE"] = 57] = "NINE";
    CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
    CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
    CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
    CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
    CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
    CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
const TO_LOWER_BIT = 32;
var BinTrieFlags;
(function (BinTrieFlags) {
    BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
    BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber(code) {
    return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F));
}
function isAsciiAlphaNumeric(code) {
    return ((code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z) ||
        (code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z) ||
        isNumber(code));
}
/**
 * Checks if the given character is a valid end character for an entity in an attribute.
 *
 * Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
 * See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
 */
function isEntityInAttributeInvalidEnd(code) {
    return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function (EntityDecoderState) {
    EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function (DecodingMode) {
    /** Entities in text nodes that can end with any character. */
    DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
    /** Only allow entities terminated with a semicolon. */
    DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
    /** Entities in attributes have limitations on ending characters. */
    DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
/**
 * Token decoder with support of writing partial entities.
 */
class EntityDecoder {
    constructor(
    /** The tree used to decode entities. */
    decodeTree, 
    /**
     * The function that is called when a codepoint is decoded.
     *
     * For multi-byte named entities, this will be called multiple times,
     * with the second codepoint, and the same `consumed` value.
     *
     * @param codepoint The decoded codepoint.
     * @param consumed The number of bytes consumed by the decoder.
     */
    emitCodePoint, 
    /** An object that is used to produce errors. */
    errors) {
        this.decodeTree = decodeTree;
        this.emitCodePoint = emitCodePoint;
        this.errors = errors;
        /** The current state of the decoder. */
        this.state = EntityDecoderState.EntityStart;
        /** Characters that were consumed while parsing an entity. */
        this.consumed = 1;
        /**
         * The result of the entity.
         *
         * Either the result index of a numeric entity, or the codepoint of a
         * numeric entity.
         */
        this.result = 0;
        /** The current index in the decode tree. */
        this.treeIndex = 0;
        /** The number of characters that were consumed in excess. */
        this.excess = 1;
        /** The mode in which the decoder is operating. */
        this.decodeMode = DecodingMode.Strict;
    }
    /** Resets the instance to make it reusable. */
    startEntity(decodeMode) {
        this.decodeMode = decodeMode;
        this.state = EntityDecoderState.EntityStart;
        this.result = 0;
        this.treeIndex = 0;
        this.excess = 1;
        this.consumed = 1;
    }
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(input, offset) {
        switch (this.state) {
            case EntityDecoderState.EntityStart: {
                if (input.charCodeAt(offset) === CharCodes.NUM) {
                    this.state = EntityDecoderState.NumericStart;
                    this.consumed += 1;
                    return this.stateNumericStart(input, offset + 1);
                }
                this.state = EntityDecoderState.NamedEntity;
                return this.stateNamedEntity(input, offset);
            }
            case EntityDecoderState.NumericStart: {
                return this.stateNumericStart(input, offset);
            }
            case EntityDecoderState.NumericDecimal: {
                return this.stateNumericDecimal(input, offset);
            }
            case EntityDecoderState.NumericHex: {
                return this.stateNumericHex(input, offset);
            }
            case EntityDecoderState.NamedEntity: {
                return this.stateNamedEntity(input, offset);
            }
        }
    }
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericStart(input, offset) {
        if (offset >= input.length) {
            return -1;
        }
        if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
            this.state = EntityDecoderState.NumericHex;
            this.consumed += 1;
            return this.stateNumericHex(input, offset + 1);
        }
        this.state = EntityDecoderState.NumericDecimal;
        return this.stateNumericDecimal(input, offset);
    }
    addToNumericResult(input, start, end, base) {
        if (start !== end) {
            const digitCount = end - start;
            this.result =
                this.result * Math.pow(base, digitCount) +
                    Number.parseInt(input.substr(start, digitCount), base);
            this.consumed += digitCount;
        }
    }
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericHex(input, offset) {
        const startIndex = offset;
        while (offset < input.length) {
            const char = input.charCodeAt(offset);
            if (isNumber(char) || isHexadecimalCharacter(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(input, startIndex, offset, 16);
                return this.emitNumericEntity(char, 3);
            }
        }
        this.addToNumericResult(input, startIndex, offset, 16);
        return -1;
    }
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericDecimal(input, offset) {
        const startIndex = offset;
        while (offset < input.length) {
            const char = input.charCodeAt(offset);
            if (isNumber(char)) {
                offset += 1;
            }
            else {
                this.addToNumericResult(input, startIndex, offset, 10);
                return this.emitNumericEntity(char, 2);
            }
        }
        this.addToNumericResult(input, startIndex, offset, 10);
        return -1;
    }
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    emitNumericEntity(lastCp, expectedLength) {
        var _a;
        // Ensure we consumed at least one digit.
        if (this.consumed <= expectedLength) {
            (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
            return 0;
        }
        // Figure out if this is a legit end of the entity
        if (lastCp === CharCodes.SEMI) {
            this.consumed += 1;
        }
        else if (this.decodeMode === DecodingMode.Strict) {
            return 0;
        }
        this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
        if (this.errors) {
            if (lastCp !== CharCodes.SEMI) {
                this.errors.missingSemicolonAfterCharacterReference();
            }
            this.errors.validateNumericCharacterReference(this.result);
        }
        return this.consumed;
    }
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNamedEntity(input, offset) {
        const { decodeTree } = this;
        let current = decodeTree[this.treeIndex];
        // The mask is the number of bytes of the value, including the current byte.
        let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        for (; offset < input.length; offset++, this.excess++) {
            const char = input.charCodeAt(offset);
            this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
            if (this.treeIndex < 0) {
                return this.result === 0 ||
                    // If we are parsing an attribute
                    (this.decodeMode === DecodingMode.Attribute &&
                        // We shouldn't have consumed any characters after the entity,
                        (valueLength === 0 ||
                            // And there should be no invalid characters.
                            isEntityInAttributeInvalidEnd(char)))
                    ? 0
                    : this.emitNotTerminatedNamedEntity();
            }
            current = decodeTree[this.treeIndex];
            valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
            // If the branch is a value, store it and continue
            if (valueLength !== 0) {
                // If the entity is terminated by a semicolon, we are done.
                if (char === CharCodes.SEMI) {
                    return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
                }
                // If we encounter a non-terminated (legacy) entity while parsing strictly, then ignore it.
                if (this.decodeMode !== DecodingMode.Strict) {
                    this.result = this.treeIndex;
                    this.consumed += this.excess;
                    this.excess = 0;
                }
            }
        }
        return -1;
    }
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    emitNotTerminatedNamedEntity() {
        var _a;
        const { result, decodeTree } = this;
        const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
        this.emitNamedEntityData(result, valueLength, this.consumed);
        (_a = this.errors) === null || _a === void 0 ? void 0 : _a.missingSemicolonAfterCharacterReference();
        return this.consumed;
    }
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    emitNamedEntityData(result, valueLength, consumed) {
        const { decodeTree } = this;
        this.emitCodePoint(valueLength === 1
            ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH
            : decodeTree[result + 1], consumed);
        if (valueLength === 3) {
            // For multi-byte values, we need to emit the second byte.
            this.emitCodePoint(decodeTree[result + 2], consumed);
        }
        return consumed;
    }
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    end() {
        var _a;
        switch (this.state) {
            case EntityDecoderState.NamedEntity: {
                // Emit a named entity if we have one.
                return this.result !== 0 &&
                    (this.decodeMode !== DecodingMode.Attribute ||
                        this.result === this.treeIndex)
                    ? this.emitNotTerminatedNamedEntity()
                    : 0;
            }
            // Otherwise, emit a numeric entity if we have one.
            case EntityDecoderState.NumericDecimal: {
                return this.emitNumericEntity(0, 2);
            }
            case EntityDecoderState.NumericHex: {
                return this.emitNumericEntity(0, 3);
            }
            case EntityDecoderState.NumericStart: {
                (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
                return 0;
            }
            case EntityDecoderState.EntityStart: {
                // Return 0 if we have no entity.
                return 0;
            }
        }
    }
}
/**
 * Creates a function that decodes entities in a string.
 *
 * @param decodeTree The decode tree.
 * @returns A function that decodes entities in a string.
 */
function getDecoder(decodeTree) {
    let returnValue = "";
    const decoder = new EntityDecoder(decodeTree, (data) => (returnValue += fromCodePoint(data)));
    return function decodeWithTrie(input, decodeMode) {
        let lastIndex = 0;
        let offset = 0;
        while ((offset = input.indexOf("&", offset)) >= 0) {
            returnValue += input.slice(lastIndex, offset);
            decoder.startEntity(decodeMode);
            const length = decoder.write(input, 
            // Skip the "&"
            offset + 1);
            if (length < 0) {
                lastIndex = offset + decoder.end();
                break;
            }
            lastIndex = offset + length;
            // If `length` is 0, skip the current `&` and continue.
            offset = length === 0 ? lastIndex + 1 : lastIndex;
        }
        const result = returnValue + input.slice(lastIndex);
        // Make sure we don't keep a reference to the final string.
        returnValue = "";
        return result;
    };
}
/**
 * Determines the branch of the current node that is taken given the current
 * character. This function is used to traverse the trie.
 *
 * @param decodeTree The trie.
 * @param current The current node.
 * @param nodeIdx The index right after the current node and its value.
 * @param char The current character.
 * @returns The index of the next node, or -1 if no branch is taken.
 */
function determineBranch(decodeTree, current, nodeIndex, char) {
    const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
    // Case 1: Single branch encoded in jump offset
    if (branchCount === 0) {
        return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
    }
    // Case 2: Multiple branches encoded in jump table
    if (jumpOffset) {
        const value = char - jumpOffset;
        return value < 0 || value >= branchCount
            ? -1
            : decodeTree[nodeIndex + value] - 1;
    }
    // Case 3: Multiple branches encoded in dictionary
    // Binary search for the character.
    let lo = nodeIndex;
    let hi = lo + branchCount - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const midValue = decodeTree[mid];
        if (midValue < char) {
            lo = mid + 1;
        }
        else if (midValue > char) {
            hi = mid - 1;
        }
        else {
            return decodeTree[mid + branchCount];
        }
    }
    return -1;
}
const htmlDecoder = /* #__PURE__ */ (/* unused pure expression or super */ null && (getDecoder(htmlDecodeTree)));
const xmlDecoder = /* #__PURE__ */ (/* unused pure expression or super */ null && (getDecoder(xmlDecodeTree)));
/**
 * Decodes an HTML string.
 *
 * @param htmlString The string to decode.
 * @param mode The decoding mode.
 * @returns The decoded string.
 */
function decodeHTML(htmlString, mode = DecodingMode.Legacy) {
    return htmlDecoder(htmlString, mode);
}
/**
 * Decodes an HTML string in an attribute.
 *
 * @param htmlAttribute The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLAttribute(htmlAttribute) {
    return htmlDecoder(htmlAttribute, DecodingMode.Attribute);
}
/**
 * Decodes an HTML string, requiring all entities to be terminated by a semicolon.
 *
 * @param htmlString The string to decode.
 * @returns The decoded string.
 */
function decodeHTMLStrict(htmlString) {
    return htmlDecoder(htmlString, DecodingMode.Strict);
}
/**
 * Decodes an XML string, requiring all entities to be terminated by a semicolon.
 *
 * @param xmlString The string to decode.
 * @returns The decoded string.
 */
function decodeXML(xmlString) {
    return xmlDecoder(xmlString, DecodingMode.Strict);
}
// Re-export for use by eg. htmlparser2




;// ./node_modules/parse5/dist/common/html.js
/** All valid namespaces in HTML. */
var NS;
(function (NS) {
    NS["HTML"] = "http://www.w3.org/1999/xhtml";
    NS["MATHML"] = "http://www.w3.org/1998/Math/MathML";
    NS["SVG"] = "http://www.w3.org/2000/svg";
    NS["XLINK"] = "http://www.w3.org/1999/xlink";
    NS["XML"] = "http://www.w3.org/XML/1998/namespace";
    NS["XMLNS"] = "http://www.w3.org/2000/xmlns/";
})(NS || (NS = {}));
var ATTRS;
(function (ATTRS) {
    ATTRS["TYPE"] = "type";
    ATTRS["ACTION"] = "action";
    ATTRS["ENCODING"] = "encoding";
    ATTRS["PROMPT"] = "prompt";
    ATTRS["NAME"] = "name";
    ATTRS["COLOR"] = "color";
    ATTRS["FACE"] = "face";
    ATTRS["SIZE"] = "size";
})(ATTRS || (ATTRS = {}));
/**
 * The mode of the document.
 *
 * @see {@link https://dom.spec.whatwg.org/#concept-document-limited-quirks}
 */
var DOCUMENT_MODE;
(function (DOCUMENT_MODE) {
    DOCUMENT_MODE["NO_QUIRKS"] = "no-quirks";
    DOCUMENT_MODE["QUIRKS"] = "quirks";
    DOCUMENT_MODE["LIMITED_QUIRKS"] = "limited-quirks";
})(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
var TAG_NAMES;
(function (TAG_NAMES) {
    TAG_NAMES["A"] = "a";
    TAG_NAMES["ADDRESS"] = "address";
    TAG_NAMES["ANNOTATION_XML"] = "annotation-xml";
    TAG_NAMES["APPLET"] = "applet";
    TAG_NAMES["AREA"] = "area";
    TAG_NAMES["ARTICLE"] = "article";
    TAG_NAMES["ASIDE"] = "aside";
    TAG_NAMES["B"] = "b";
    TAG_NAMES["BASE"] = "base";
    TAG_NAMES["BASEFONT"] = "basefont";
    TAG_NAMES["BGSOUND"] = "bgsound";
    TAG_NAMES["BIG"] = "big";
    TAG_NAMES["BLOCKQUOTE"] = "blockquote";
    TAG_NAMES["BODY"] = "body";
    TAG_NAMES["BR"] = "br";
    TAG_NAMES["BUTTON"] = "button";
    TAG_NAMES["CAPTION"] = "caption";
    TAG_NAMES["CENTER"] = "center";
    TAG_NAMES["CODE"] = "code";
    TAG_NAMES["COL"] = "col";
    TAG_NAMES["COLGROUP"] = "colgroup";
    TAG_NAMES["DD"] = "dd";
    TAG_NAMES["DESC"] = "desc";
    TAG_NAMES["DETAILS"] = "details";
    TAG_NAMES["DIALOG"] = "dialog";
    TAG_NAMES["DIR"] = "dir";
    TAG_NAMES["DIV"] = "div";
    TAG_NAMES["DL"] = "dl";
    TAG_NAMES["DT"] = "dt";
    TAG_NAMES["EM"] = "em";
    TAG_NAMES["EMBED"] = "embed";
    TAG_NAMES["FIELDSET"] = "fieldset";
    TAG_NAMES["FIGCAPTION"] = "figcaption";
    TAG_NAMES["FIGURE"] = "figure";
    TAG_NAMES["FONT"] = "font";
    TAG_NAMES["FOOTER"] = "footer";
    TAG_NAMES["FOREIGN_OBJECT"] = "foreignObject";
    TAG_NAMES["FORM"] = "form";
    TAG_NAMES["FRAME"] = "frame";
    TAG_NAMES["FRAMESET"] = "frameset";
    TAG_NAMES["H1"] = "h1";
    TAG_NAMES["H2"] = "h2";
    TAG_NAMES["H3"] = "h3";
    TAG_NAMES["H4"] = "h4";
    TAG_NAMES["H5"] = "h5";
    TAG_NAMES["H6"] = "h6";
    TAG_NAMES["HEAD"] = "head";
    TAG_NAMES["HEADER"] = "header";
    TAG_NAMES["HGROUP"] = "hgroup";
    TAG_NAMES["HR"] = "hr";
    TAG_NAMES["HTML"] = "html";
    TAG_NAMES["I"] = "i";
    TAG_NAMES["IMG"] = "img";
    TAG_NAMES["IMAGE"] = "image";
    TAG_NAMES["INPUT"] = "input";
    TAG_NAMES["IFRAME"] = "iframe";
    TAG_NAMES["KEYGEN"] = "keygen";
    TAG_NAMES["LABEL"] = "label";
    TAG_NAMES["LI"] = "li";
    TAG_NAMES["LINK"] = "link";
    TAG_NAMES["LISTING"] = "listing";
    TAG_NAMES["MAIN"] = "main";
    TAG_NAMES["MALIGNMARK"] = "malignmark";
    TAG_NAMES["MARQUEE"] = "marquee";
    TAG_NAMES["MATH"] = "math";
    TAG_NAMES["MENU"] = "menu";
    TAG_NAMES["META"] = "meta";
    TAG_NAMES["MGLYPH"] = "mglyph";
    TAG_NAMES["MI"] = "mi";
    TAG_NAMES["MO"] = "mo";
    TAG_NAMES["MN"] = "mn";
    TAG_NAMES["MS"] = "ms";
    TAG_NAMES["MTEXT"] = "mtext";
    TAG_NAMES["NAV"] = "nav";
    TAG_NAMES["NOBR"] = "nobr";
    TAG_NAMES["NOFRAMES"] = "noframes";
    TAG_NAMES["NOEMBED"] = "noembed";
    TAG_NAMES["NOSCRIPT"] = "noscript";
    TAG_NAMES["OBJECT"] = "object";
    TAG_NAMES["OL"] = "ol";
    TAG_NAMES["OPTGROUP"] = "optgroup";
    TAG_NAMES["OPTION"] = "option";
    TAG_NAMES["P"] = "p";
    TAG_NAMES["PARAM"] = "param";
    TAG_NAMES["PLAINTEXT"] = "plaintext";
    TAG_NAMES["PRE"] = "pre";
    TAG_NAMES["RB"] = "rb";
    TAG_NAMES["RP"] = "rp";
    TAG_NAMES["RT"] = "rt";
    TAG_NAMES["RTC"] = "rtc";
    TAG_NAMES["RUBY"] = "ruby";
    TAG_NAMES["S"] = "s";
    TAG_NAMES["SCRIPT"] = "script";
    TAG_NAMES["SEARCH"] = "search";
    TAG_NAMES["SECTION"] = "section";
    TAG_NAMES["SELECT"] = "select";
    TAG_NAMES["SOURCE"] = "source";
    TAG_NAMES["SMALL"] = "small";
    TAG_NAMES["SPAN"] = "span";
    TAG_NAMES["STRIKE"] = "strike";
    TAG_NAMES["STRONG"] = "strong";
    TAG_NAMES["STYLE"] = "style";
    TAG_NAMES["SUB"] = "sub";
    TAG_NAMES["SUMMARY"] = "summary";
    TAG_NAMES["SUP"] = "sup";
    TAG_NAMES["TABLE"] = "table";
    TAG_NAMES["TBODY"] = "tbody";
    TAG_NAMES["TEMPLATE"] = "template";
    TAG_NAMES["TEXTAREA"] = "textarea";
    TAG_NAMES["TFOOT"] = "tfoot";
    TAG_NAMES["TD"] = "td";
    TAG_NAMES["TH"] = "th";
    TAG_NAMES["THEAD"] = "thead";
    TAG_NAMES["TITLE"] = "title";
    TAG_NAMES["TR"] = "tr";
    TAG_NAMES["TRACK"] = "track";
    TAG_NAMES["TT"] = "tt";
    TAG_NAMES["U"] = "u";
    TAG_NAMES["UL"] = "ul";
    TAG_NAMES["SVG"] = "svg";
    TAG_NAMES["VAR"] = "var";
    TAG_NAMES["WBR"] = "wbr";
    TAG_NAMES["XMP"] = "xmp";
})(TAG_NAMES || (TAG_NAMES = {}));
/**
 * Tag IDs are numeric IDs for known tag names.
 *
 * We use tag IDs to improve the performance of tag name comparisons.
 */
var TAG_ID;
(function (TAG_ID) {
    TAG_ID[TAG_ID["UNKNOWN"] = 0] = "UNKNOWN";
    TAG_ID[TAG_ID["A"] = 1] = "A";
    TAG_ID[TAG_ID["ADDRESS"] = 2] = "ADDRESS";
    TAG_ID[TAG_ID["ANNOTATION_XML"] = 3] = "ANNOTATION_XML";
    TAG_ID[TAG_ID["APPLET"] = 4] = "APPLET";
    TAG_ID[TAG_ID["AREA"] = 5] = "AREA";
    TAG_ID[TAG_ID["ARTICLE"] = 6] = "ARTICLE";
    TAG_ID[TAG_ID["ASIDE"] = 7] = "ASIDE";
    TAG_ID[TAG_ID["B"] = 8] = "B";
    TAG_ID[TAG_ID["BASE"] = 9] = "BASE";
    TAG_ID[TAG_ID["BASEFONT"] = 10] = "BASEFONT";
    TAG_ID[TAG_ID["BGSOUND"] = 11] = "BGSOUND";
    TAG_ID[TAG_ID["BIG"] = 12] = "BIG";
    TAG_ID[TAG_ID["BLOCKQUOTE"] = 13] = "BLOCKQUOTE";
    TAG_ID[TAG_ID["BODY"] = 14] = "BODY";
    TAG_ID[TAG_ID["BR"] = 15] = "BR";
    TAG_ID[TAG_ID["BUTTON"] = 16] = "BUTTON";
    TAG_ID[TAG_ID["CAPTION"] = 17] = "CAPTION";
    TAG_ID[TAG_ID["CENTER"] = 18] = "CENTER";
    TAG_ID[TAG_ID["CODE"] = 19] = "CODE";
    TAG_ID[TAG_ID["COL"] = 20] = "COL";
    TAG_ID[TAG_ID["COLGROUP"] = 21] = "COLGROUP";
    TAG_ID[TAG_ID["DD"] = 22] = "DD";
    TAG_ID[TAG_ID["DESC"] = 23] = "DESC";
    TAG_ID[TAG_ID["DETAILS"] = 24] = "DETAILS";
    TAG_ID[TAG_ID["DIALOG"] = 25] = "DIALOG";
    TAG_ID[TAG_ID["DIR"] = 26] = "DIR";
    TAG_ID[TAG_ID["DIV"] = 27] = "DIV";
    TAG_ID[TAG_ID["DL"] = 28] = "DL";
    TAG_ID[TAG_ID["DT"] = 29] = "DT";
    TAG_ID[TAG_ID["EM"] = 30] = "EM";
    TAG_ID[TAG_ID["EMBED"] = 31] = "EMBED";
    TAG_ID[TAG_ID["FIELDSET"] = 32] = "FIELDSET";
    TAG_ID[TAG_ID["FIGCAPTION"] = 33] = "FIGCAPTION";
    TAG_ID[TAG_ID["FIGURE"] = 34] = "FIGURE";
    TAG_ID[TAG_ID["FONT"] = 35] = "FONT";
    TAG_ID[TAG_ID["FOOTER"] = 36] = "FOOTER";
    TAG_ID[TAG_ID["FOREIGN_OBJECT"] = 37] = "FOREIGN_OBJECT";
    TAG_ID[TAG_ID["FORM"] = 38] = "FORM";
    TAG_ID[TAG_ID["FRAME"] = 39] = "FRAME";
    TAG_ID[TAG_ID["FRAMESET"] = 40] = "FRAMESET";
    TAG_ID[TAG_ID["H1"] = 41] = "H1";
    TAG_ID[TAG_ID["H2"] = 42] = "H2";
    TAG_ID[TAG_ID["H3"] = 43] = "H3";
    TAG_ID[TAG_ID["H4"] = 44] = "H4";
    TAG_ID[TAG_ID["H5"] = 45] = "H5";
    TAG_ID[TAG_ID["H6"] = 46] = "H6";
    TAG_ID[TAG_ID["HEAD"] = 47] = "HEAD";
    TAG_ID[TAG_ID["HEADER"] = 48] = "HEADER";
    TAG_ID[TAG_ID["HGROUP"] = 49] = "HGROUP";
    TAG_ID[TAG_ID["HR"] = 50] = "HR";
    TAG_ID[TAG_ID["HTML"] = 51] = "HTML";
    TAG_ID[TAG_ID["I"] = 52] = "I";
    TAG_ID[TAG_ID["IMG"] = 53] = "IMG";
    TAG_ID[TAG_ID["IMAGE"] = 54] = "IMAGE";
    TAG_ID[TAG_ID["INPUT"] = 55] = "INPUT";
    TAG_ID[TAG_ID["IFRAME"] = 56] = "IFRAME";
    TAG_ID[TAG_ID["KEYGEN"] = 57] = "KEYGEN";
    TAG_ID[TAG_ID["LABEL"] = 58] = "LABEL";
    TAG_ID[TAG_ID["LI"] = 59] = "LI";
    TAG_ID[TAG_ID["LINK"] = 60] = "LINK";
    TAG_ID[TAG_ID["LISTING"] = 61] = "LISTING";
    TAG_ID[TAG_ID["MAIN"] = 62] = "MAIN";
    TAG_ID[TAG_ID["MALIGNMARK"] = 63] = "MALIGNMARK";
    TAG_ID[TAG_ID["MARQUEE"] = 64] = "MARQUEE";
    TAG_ID[TAG_ID["MATH"] = 65] = "MATH";
    TAG_ID[TAG_ID["MENU"] = 66] = "MENU";
    TAG_ID[TAG_ID["META"] = 67] = "META";
    TAG_ID[TAG_ID["MGLYPH"] = 68] = "MGLYPH";
    TAG_ID[TAG_ID["MI"] = 69] = "MI";
    TAG_ID[TAG_ID["MO"] = 70] = "MO";
    TAG_ID[TAG_ID["MN"] = 71] = "MN";
    TAG_ID[TAG_ID["MS"] = 72] = "MS";
    TAG_ID[TAG_ID["MTEXT"] = 73] = "MTEXT";
    TAG_ID[TAG_ID["NAV"] = 74] = "NAV";
    TAG_ID[TAG_ID["NOBR"] = 75] = "NOBR";
    TAG_ID[TAG_ID["NOFRAMES"] = 76] = "NOFRAMES";
    TAG_ID[TAG_ID["NOEMBED"] = 77] = "NOEMBED";
    TAG_ID[TAG_ID["NOSCRIPT"] = 78] = "NOSCRIPT";
    TAG_ID[TAG_ID["OBJECT"] = 79] = "OBJECT";
    TAG_ID[TAG_ID["OL"] = 80] = "OL";
    TAG_ID[TAG_ID["OPTGROUP"] = 81] = "OPTGROUP";
    TAG_ID[TAG_ID["OPTION"] = 82] = "OPTION";
    TAG_ID[TAG_ID["P"] = 83] = "P";
    TAG_ID[TAG_ID["PARAM"] = 84] = "PARAM";
    TAG_ID[TAG_ID["PLAINTEXT"] = 85] = "PLAINTEXT";
    TAG_ID[TAG_ID["PRE"] = 86] = "PRE";
    TAG_ID[TAG_ID["RB"] = 87] = "RB";
    TAG_ID[TAG_ID["RP"] = 88] = "RP";
    TAG_ID[TAG_ID["RT"] = 89] = "RT";
    TAG_ID[TAG_ID["RTC"] = 90] = "RTC";
    TAG_ID[TAG_ID["RUBY"] = 91] = "RUBY";
    TAG_ID[TAG_ID["S"] = 92] = "S";
    TAG_ID[TAG_ID["SCRIPT"] = 93] = "SCRIPT";
    TAG_ID[TAG_ID["SEARCH"] = 94] = "SEARCH";
    TAG_ID[TAG_ID["SECTION"] = 95] = "SECTION";
    TAG_ID[TAG_ID["SELECT"] = 96] = "SELECT";
    TAG_ID[TAG_ID["SOURCE"] = 97] = "SOURCE";
    TAG_ID[TAG_ID["SMALL"] = 98] = "SMALL";
    TAG_ID[TAG_ID["SPAN"] = 99] = "SPAN";
    TAG_ID[TAG_ID["STRIKE"] = 100] = "STRIKE";
    TAG_ID[TAG_ID["STRONG"] = 101] = "STRONG";
    TAG_ID[TAG_ID["STYLE"] = 102] = "STYLE";
    TAG_ID[TAG_ID["SUB"] = 103] = "SUB";
    TAG_ID[TAG_ID["SUMMARY"] = 104] = "SUMMARY";
    TAG_ID[TAG_ID["SUP"] = 105] = "SUP";
    TAG_ID[TAG_ID["TABLE"] = 106] = "TABLE";
    TAG_ID[TAG_ID["TBODY"] = 107] = "TBODY";
    TAG_ID[TAG_ID["TEMPLATE"] = 108] = "TEMPLATE";
    TAG_ID[TAG_ID["TEXTAREA"] = 109] = "TEXTAREA";
    TAG_ID[TAG_ID["TFOOT"] = 110] = "TFOOT";
    TAG_ID[TAG_ID["TD"] = 111] = "TD";
    TAG_ID[TAG_ID["TH"] = 112] = "TH";
    TAG_ID[TAG_ID["THEAD"] = 113] = "THEAD";
    TAG_ID[TAG_ID["TITLE"] = 114] = "TITLE";
    TAG_ID[TAG_ID["TR"] = 115] = "TR";
    TAG_ID[TAG_ID["TRACK"] = 116] = "TRACK";
    TAG_ID[TAG_ID["TT"] = 117] = "TT";
    TAG_ID[TAG_ID["U"] = 118] = "U";
    TAG_ID[TAG_ID["UL"] = 119] = "UL";
    TAG_ID[TAG_ID["SVG"] = 120] = "SVG";
    TAG_ID[TAG_ID["VAR"] = 121] = "VAR";
    TAG_ID[TAG_ID["WBR"] = 122] = "WBR";
    TAG_ID[TAG_ID["XMP"] = 123] = "XMP";
})(TAG_ID || (TAG_ID = {}));
const TAG_NAME_TO_ID = new Map([
    [TAG_NAMES.A, TAG_ID.A],
    [TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
    [TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
    [TAG_NAMES.APPLET, TAG_ID.APPLET],
    [TAG_NAMES.AREA, TAG_ID.AREA],
    [TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
    [TAG_NAMES.ASIDE, TAG_ID.ASIDE],
    [TAG_NAMES.B, TAG_ID.B],
    [TAG_NAMES.BASE, TAG_ID.BASE],
    [TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
    [TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
    [TAG_NAMES.BIG, TAG_ID.BIG],
    [TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
    [TAG_NAMES.BODY, TAG_ID.BODY],
    [TAG_NAMES.BR, TAG_ID.BR],
    [TAG_NAMES.BUTTON, TAG_ID.BUTTON],
    [TAG_NAMES.CAPTION, TAG_ID.CAPTION],
    [TAG_NAMES.CENTER, TAG_ID.CENTER],
    [TAG_NAMES.CODE, TAG_ID.CODE],
    [TAG_NAMES.COL, TAG_ID.COL],
    [TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
    [TAG_NAMES.DD, TAG_ID.DD],
    [TAG_NAMES.DESC, TAG_ID.DESC],
    [TAG_NAMES.DETAILS, TAG_ID.DETAILS],
    [TAG_NAMES.DIALOG, TAG_ID.DIALOG],
    [TAG_NAMES.DIR, TAG_ID.DIR],
    [TAG_NAMES.DIV, TAG_ID.DIV],
    [TAG_NAMES.DL, TAG_ID.DL],
    [TAG_NAMES.DT, TAG_ID.DT],
    [TAG_NAMES.EM, TAG_ID.EM],
    [TAG_NAMES.EMBED, TAG_ID.EMBED],
    [TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
    [TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
    [TAG_NAMES.FIGURE, TAG_ID.FIGURE],
    [TAG_NAMES.FONT, TAG_ID.FONT],
    [TAG_NAMES.FOOTER, TAG_ID.FOOTER],
    [TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
    [TAG_NAMES.FORM, TAG_ID.FORM],
    [TAG_NAMES.FRAME, TAG_ID.FRAME],
    [TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
    [TAG_NAMES.H1, TAG_ID.H1],
    [TAG_NAMES.H2, TAG_ID.H2],
    [TAG_NAMES.H3, TAG_ID.H3],
    [TAG_NAMES.H4, TAG_ID.H4],
    [TAG_NAMES.H5, TAG_ID.H5],
    [TAG_NAMES.H6, TAG_ID.H6],
    [TAG_NAMES.HEAD, TAG_ID.HEAD],
    [TAG_NAMES.HEADER, TAG_ID.HEADER],
    [TAG_NAMES.HGROUP, TAG_ID.HGROUP],
    [TAG_NAMES.HR, TAG_ID.HR],
    [TAG_NAMES.HTML, TAG_ID.HTML],
    [TAG_NAMES.I, TAG_ID.I],
    [TAG_NAMES.IMG, TAG_ID.IMG],
    [TAG_NAMES.IMAGE, TAG_ID.IMAGE],
    [TAG_NAMES.INPUT, TAG_ID.INPUT],
    [TAG_NAMES.IFRAME, TAG_ID.IFRAME],
    [TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
    [TAG_NAMES.LABEL, TAG_ID.LABEL],
    [TAG_NAMES.LI, TAG_ID.LI],
    [TAG_NAMES.LINK, TAG_ID.LINK],
    [TAG_NAMES.LISTING, TAG_ID.LISTING],
    [TAG_NAMES.MAIN, TAG_ID.MAIN],
    [TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
    [TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
    [TAG_NAMES.MATH, TAG_ID.MATH],
    [TAG_NAMES.MENU, TAG_ID.MENU],
    [TAG_NAMES.META, TAG_ID.META],
    [TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
    [TAG_NAMES.MI, TAG_ID.MI],
    [TAG_NAMES.MO, TAG_ID.MO],
    [TAG_NAMES.MN, TAG_ID.MN],
    [TAG_NAMES.MS, TAG_ID.MS],
    [TAG_NAMES.MTEXT, TAG_ID.MTEXT],
    [TAG_NAMES.NAV, TAG_ID.NAV],
    [TAG_NAMES.NOBR, TAG_ID.NOBR],
    [TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
    [TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
    [TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
    [TAG_NAMES.OBJECT, TAG_ID.OBJECT],
    [TAG_NAMES.OL, TAG_ID.OL],
    [TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
    [TAG_NAMES.OPTION, TAG_ID.OPTION],
    [TAG_NAMES.P, TAG_ID.P],
    [TAG_NAMES.PARAM, TAG_ID.PARAM],
    [TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
    [TAG_NAMES.PRE, TAG_ID.PRE],
    [TAG_NAMES.RB, TAG_ID.RB],
    [TAG_NAMES.RP, TAG_ID.RP],
    [TAG_NAMES.RT, TAG_ID.RT],
    [TAG_NAMES.RTC, TAG_ID.RTC],
    [TAG_NAMES.RUBY, TAG_ID.RUBY],
    [TAG_NAMES.S, TAG_ID.S],
    [TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
    [TAG_NAMES.SEARCH, TAG_ID.SEARCH],
    [TAG_NAMES.SECTION, TAG_ID.SECTION],
    [TAG_NAMES.SELECT, TAG_ID.SELECT],
    [TAG_NAMES.SOURCE, TAG_ID.SOURCE],
    [TAG_NAMES.SMALL, TAG_ID.SMALL],
    [TAG_NAMES.SPAN, TAG_ID.SPAN],
    [TAG_NAMES.STRIKE, TAG_ID.STRIKE],
    [TAG_NAMES.STRONG, TAG_ID.STRONG],
    [TAG_NAMES.STYLE, TAG_ID.STYLE],
    [TAG_NAMES.SUB, TAG_ID.SUB],
    [TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
    [TAG_NAMES.SUP, TAG_ID.SUP],
    [TAG_NAMES.TABLE, TAG_ID.TABLE],
    [TAG_NAMES.TBODY, TAG_ID.TBODY],
    [TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
    [TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
    [TAG_NAMES.TFOOT, TAG_ID.TFOOT],
    [TAG_NAMES.TD, TAG_ID.TD],
    [TAG_NAMES.TH, TAG_ID.TH],
    [TAG_NAMES.THEAD, TAG_ID.THEAD],
    [TAG_NAMES.TITLE, TAG_ID.TITLE],
    [TAG_NAMES.TR, TAG_ID.TR],
    [TAG_NAMES.TRACK, TAG_ID.TRACK],
    [TAG_NAMES.TT, TAG_ID.TT],
    [TAG_NAMES.U, TAG_ID.U],
    [TAG_NAMES.UL, TAG_ID.UL],
    [TAG_NAMES.SVG, TAG_ID.SVG],
    [TAG_NAMES.VAR, TAG_ID.VAR],
    [TAG_NAMES.WBR, TAG_ID.WBR],
    [TAG_NAMES.XMP, TAG_ID.XMP],
]);
function getTagID(tagName) {
    var _a;
    return (_a = TAG_NAME_TO_ID.get(tagName)) !== null && _a !== void 0 ? _a : TAG_ID.UNKNOWN;
}
const $ = TAG_ID;
const SPECIAL_ELEMENTS = {
    [NS.HTML]: new Set([
        $.ADDRESS,
        $.APPLET,
        $.AREA,
        $.ARTICLE,
        $.ASIDE,
        $.BASE,
        $.BASEFONT,
        $.BGSOUND,
        $.BLOCKQUOTE,
        $.BODY,
        $.BR,
        $.BUTTON,
        $.CAPTION,
        $.CENTER,
        $.COL,
        $.COLGROUP,
        $.DD,
        $.DETAILS,
        $.DIR,
        $.DIV,
        $.DL,
        $.DT,
        $.EMBED,
        $.FIELDSET,
        $.FIGCAPTION,
        $.FIGURE,
        $.FOOTER,
        $.FORM,
        $.FRAME,
        $.FRAMESET,
        $.H1,
        $.H2,
        $.H3,
        $.H4,
        $.H5,
        $.H6,
        $.HEAD,
        $.HEADER,
        $.HGROUP,
        $.HR,
        $.HTML,
        $.IFRAME,
        $.IMG,
        $.INPUT,
        $.LI,
        $.LINK,
        $.LISTING,
        $.MAIN,
        $.MARQUEE,
        $.MENU,
        $.META,
        $.NAV,
        $.NOEMBED,
        $.NOFRAMES,
        $.NOSCRIPT,
        $.OBJECT,
        $.OL,
        $.P,
        $.PARAM,
        $.PLAINTEXT,
        $.PRE,
        $.SCRIPT,
        $.SECTION,
        $.SELECT,
        $.SOURCE,
        $.STYLE,
        $.SUMMARY,
        $.TABLE,
        $.TBODY,
        $.TD,
        $.TEMPLATE,
        $.TEXTAREA,
        $.TFOOT,
        $.TH,
        $.THEAD,
        $.TITLE,
        $.TR,
        $.TRACK,
        $.UL,
        $.WBR,
        $.XMP,
    ]),
    [NS.MATHML]: new Set([$.MI, $.MO, $.MN, $.MS, $.MTEXT, $.ANNOTATION_XML]),
    [NS.SVG]: new Set([$.TITLE, $.FOREIGN_OBJECT, $.DESC]),
    [NS.XLINK]: new Set(),
    [NS.XML]: new Set(),
    [NS.XMLNS]: new Set(),
};
const NUMBERED_HEADERS = new Set([$.H1, $.H2, $.H3, $.H4, $.H5, $.H6]);
const UNESCAPED_TEXT = new Set([
    TAG_NAMES.STYLE,
    TAG_NAMES.SCRIPT,
    TAG_NAMES.XMP,
    TAG_NAMES.IFRAME,
    TAG_NAMES.NOEMBED,
    TAG_NAMES.NOFRAMES,
    TAG_NAMES.PLAINTEXT,
]);
function hasUnescapedText(tn, scriptingEnabled) {
    return UNESCAPED_TEXT.has(tn) || (scriptingEnabled && tn === TAG_NAMES.NOSCRIPT);
}

;// ./node_modules/parse5/dist/tokenizer/index.js






//States
var State;
(function (State) {
    State[State["DATA"] = 0] = "DATA";
    State[State["RCDATA"] = 1] = "RCDATA";
    State[State["RAWTEXT"] = 2] = "RAWTEXT";
    State[State["SCRIPT_DATA"] = 3] = "SCRIPT_DATA";
    State[State["PLAINTEXT"] = 4] = "PLAINTEXT";
    State[State["TAG_OPEN"] = 5] = "TAG_OPEN";
    State[State["END_TAG_OPEN"] = 6] = "END_TAG_OPEN";
    State[State["TAG_NAME"] = 7] = "TAG_NAME";
    State[State["RCDATA_LESS_THAN_SIGN"] = 8] = "RCDATA_LESS_THAN_SIGN";
    State[State["RCDATA_END_TAG_OPEN"] = 9] = "RCDATA_END_TAG_OPEN";
    State[State["RCDATA_END_TAG_NAME"] = 10] = "RCDATA_END_TAG_NAME";
    State[State["RAWTEXT_LESS_THAN_SIGN"] = 11] = "RAWTEXT_LESS_THAN_SIGN";
    State[State["RAWTEXT_END_TAG_OPEN"] = 12] = "RAWTEXT_END_TAG_OPEN";
    State[State["RAWTEXT_END_TAG_NAME"] = 13] = "RAWTEXT_END_TAG_NAME";
    State[State["SCRIPT_DATA_LESS_THAN_SIGN"] = 14] = "SCRIPT_DATA_LESS_THAN_SIGN";
    State[State["SCRIPT_DATA_END_TAG_OPEN"] = 15] = "SCRIPT_DATA_END_TAG_OPEN";
    State[State["SCRIPT_DATA_END_TAG_NAME"] = 16] = "SCRIPT_DATA_END_TAG_NAME";
    State[State["SCRIPT_DATA_ESCAPE_START"] = 17] = "SCRIPT_DATA_ESCAPE_START";
    State[State["SCRIPT_DATA_ESCAPE_START_DASH"] = 18] = "SCRIPT_DATA_ESCAPE_START_DASH";
    State[State["SCRIPT_DATA_ESCAPED"] = 19] = "SCRIPT_DATA_ESCAPED";
    State[State["SCRIPT_DATA_ESCAPED_DASH"] = 20] = "SCRIPT_DATA_ESCAPED_DASH";
    State[State["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
    State[State["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
    State[State["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
    State[State["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
    State[State["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
    State[State["BEFORE_ATTRIBUTE_NAME"] = 31] = "BEFORE_ATTRIBUTE_NAME";
    State[State["ATTRIBUTE_NAME"] = 32] = "ATTRIBUTE_NAME";
    State[State["AFTER_ATTRIBUTE_NAME"] = 33] = "AFTER_ATTRIBUTE_NAME";
    State[State["BEFORE_ATTRIBUTE_VALUE"] = 34] = "BEFORE_ATTRIBUTE_VALUE";
    State[State["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
    State[State["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
    State[State["ATTRIBUTE_VALUE_UNQUOTED"] = 37] = "ATTRIBUTE_VALUE_UNQUOTED";
    State[State["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
    State[State["SELF_CLOSING_START_TAG"] = 39] = "SELF_CLOSING_START_TAG";
    State[State["BOGUS_COMMENT"] = 40] = "BOGUS_COMMENT";
    State[State["MARKUP_DECLARATION_OPEN"] = 41] = "MARKUP_DECLARATION_OPEN";
    State[State["COMMENT_START"] = 42] = "COMMENT_START";
    State[State["COMMENT_START_DASH"] = 43] = "COMMENT_START_DASH";
    State[State["COMMENT"] = 44] = "COMMENT";
    State[State["COMMENT_LESS_THAN_SIGN"] = 45] = "COMMENT_LESS_THAN_SIGN";
    State[State["COMMENT_LESS_THAN_SIGN_BANG"] = 46] = "COMMENT_LESS_THAN_SIGN_BANG";
    State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
    State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
    State[State["COMMENT_END_DASH"] = 49] = "COMMENT_END_DASH";
    State[State["COMMENT_END"] = 50] = "COMMENT_END";
    State[State["COMMENT_END_BANG"] = 51] = "COMMENT_END_BANG";
    State[State["DOCTYPE"] = 52] = "DOCTYPE";
    State[State["BEFORE_DOCTYPE_NAME"] = 53] = "BEFORE_DOCTYPE_NAME";
    State[State["DOCTYPE_NAME"] = 54] = "DOCTYPE_NAME";
    State[State["AFTER_DOCTYPE_NAME"] = 55] = "AFTER_DOCTYPE_NAME";
    State[State["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
    State[State["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
    State[State["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
    State[State["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
    State[State["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
    State[State["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
    State[State["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
    State[State["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
    State[State["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
    State[State["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
    State[State["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
    State[State["BOGUS_DOCTYPE"] = 67] = "BOGUS_DOCTYPE";
    State[State["CDATA_SECTION"] = 68] = "CDATA_SECTION";
    State[State["CDATA_SECTION_BRACKET"] = 69] = "CDATA_SECTION_BRACKET";
    State[State["CDATA_SECTION_END"] = 70] = "CDATA_SECTION_END";
    State[State["CHARACTER_REFERENCE"] = 71] = "CHARACTER_REFERENCE";
    State[State["AMBIGUOUS_AMPERSAND"] = 72] = "AMBIGUOUS_AMPERSAND";
})(State || (State = {}));
//Tokenizer initial states for different modes
const TokenizerMode = {
    DATA: State.DATA,
    RCDATA: State.RCDATA,
    RAWTEXT: State.RAWTEXT,
    SCRIPT_DATA: State.SCRIPT_DATA,
    PLAINTEXT: State.PLAINTEXT,
    CDATA_SECTION: State.CDATA_SECTION,
};
//Utils
//OPTIMIZATION: these utility functions should not be moved out of this module. V8 Crankshaft will not inline
//this functions if they will be situated in another module due to context switch.
//Always perform inlining check before modifying this functions ('node --trace-inlining').
function isAsciiDigit(cp) {
    return cp >= CODE_POINTS.DIGIT_0 && cp <= CODE_POINTS.DIGIT_9;
}
function isAsciiUpper(cp) {
    return cp >= CODE_POINTS.LATIN_CAPITAL_A && cp <= CODE_POINTS.LATIN_CAPITAL_Z;
}
function isAsciiLower(cp) {
    return cp >= CODE_POINTS.LATIN_SMALL_A && cp <= CODE_POINTS.LATIN_SMALL_Z;
}
function isAsciiLetter(cp) {
    return isAsciiLower(cp) || isAsciiUpper(cp);
}
function tokenizer_isAsciiAlphaNumeric(cp) {
    return isAsciiLetter(cp) || isAsciiDigit(cp);
}
function toAsciiLower(cp) {
    return cp + 32;
}
function isWhitespace(cp) {
    return cp === CODE_POINTS.SPACE || cp === CODE_POINTS.LINE_FEED || cp === CODE_POINTS.TABULATION || cp === CODE_POINTS.FORM_FEED;
}
function isScriptDataDoubleEscapeSequenceEnd(cp) {
    return isWhitespace(cp) || cp === CODE_POINTS.SOLIDUS || cp === CODE_POINTS.GREATER_THAN_SIGN;
}
function getErrorForNumericCharacterReference(code) {
    if (code === CODE_POINTS.NULL) {
        return ERR.nullCharacterReference;
    }
    else if (code > 1114111) {
        return ERR.characterReferenceOutsideUnicodeRange;
    }
    else if (isSurrogate(code)) {
        return ERR.surrogateCharacterReference;
    }
    else if (isUndefinedCodePoint(code)) {
        return ERR.noncharacterCharacterReference;
    }
    else if (isControlCodePoint(code) || code === CODE_POINTS.CARRIAGE_RETURN) {
        return ERR.controlCharacterReference;
    }
    return null;
}
//Tokenizer
class Tokenizer {
    constructor(options, handler) {
        this.options = options;
        this.handler = handler;
        this.paused = false;
        /** Ensures that the parsing loop isn't run multiple times at once. */
        this.inLoop = false;
        /**
         * Indicates that the current adjusted node exists, is not an element in the HTML namespace,
         * and that it is not an integration point for either MathML or HTML.
         *
         * @see {@link https://html.spec.whatwg.org/multipage/parsing.html#tree-construction}
         */
        this.inForeignNode = false;
        this.lastStartTagName = '';
        this.active = false;
        this.state = State.DATA;
        this.returnState = State.DATA;
        this.entityStartPos = 0;
        this.consumedAfterSnapshot = -1;
        this.currentCharacterToken = null;
        this.currentToken = null;
        this.currentAttr = { name: '', value: '' };
        this.preprocessor = new Preprocessor(handler);
        this.currentLocation = this.getCurrentLocation(-1);
        this.entityDecoder = new EntityDecoder(decode_data_html_htmlDecodeTree, (cp, consumed) => {
            // Note: Set `pos` _before_ flushing, as flushing might drop
            // the current chunk and invalidate `entityStartPos`.
            this.preprocessor.pos = this.entityStartPos + consumed - 1;
            this._flushCodePointConsumedAsCharacterReference(cp);
        }, handler.onParseError
            ? {
                missingSemicolonAfterCharacterReference: () => {
                    this._err(ERR.missingSemicolonAfterCharacterReference, 1);
                },
                absenceOfDigitsInNumericCharacterReference: (consumed) => {
                    this._err(ERR.absenceOfDigitsInNumericCharacterReference, this.entityStartPos - this.preprocessor.pos + consumed);
                },
                validateNumericCharacterReference: (code) => {
                    const error = getErrorForNumericCharacterReference(code);
                    if (error)
                        this._err(error, 1);
                },
            }
            : undefined);
    }
    //Errors
    _err(code, cpOffset = 0) {
        var _a, _b;
        (_b = (_a = this.handler).onParseError) === null || _b === void 0 ? void 0 : _b.call(_a, this.preprocessor.getError(code, cpOffset));
    }
    // NOTE: `offset` may never run across line boundaries.
    getCurrentLocation(offset) {
        if (!this.options.sourceCodeLocationInfo) {
            return null;
        }
        return {
            startLine: this.preprocessor.line,
            startCol: this.preprocessor.col - offset,
            startOffset: this.preprocessor.offset - offset,
            endLine: -1,
            endCol: -1,
            endOffset: -1,
        };
    }
    _runParsingLoop() {
        if (this.inLoop)
            return;
        this.inLoop = true;
        while (this.active && !this.paused) {
            this.consumedAfterSnapshot = 0;
            const cp = this._consume();
            if (!this._ensureHibernation()) {
                this._callState(cp);
            }
        }
        this.inLoop = false;
    }
    //API
    pause() {
        this.paused = true;
    }
    resume(writeCallback) {
        if (!this.paused) {
            throw new Error('Parser was already resumed');
        }
        this.paused = false;
        // Necessary for synchronous resume.
        if (this.inLoop)
            return;
        this._runParsingLoop();
        if (!this.paused) {
            writeCallback === null || writeCallback === void 0 ? void 0 : writeCallback();
        }
    }
    write(chunk, isLastChunk, writeCallback) {
        this.active = true;
        this.preprocessor.write(chunk, isLastChunk);
        this._runParsingLoop();
        if (!this.paused) {
            writeCallback === null || writeCallback === void 0 ? void 0 : writeCallback();
        }
    }
    insertHtmlAtCurrentPos(chunk) {
        this.active = true;
        this.preprocessor.insertHtmlAtCurrentPos(chunk);
        this._runParsingLoop();
    }
    //Hibernation
    _ensureHibernation() {
        if (this.preprocessor.endOfChunkHit) {
            this.preprocessor.retreat(this.consumedAfterSnapshot);
            this.consumedAfterSnapshot = 0;
            this.active = false;
            return true;
        }
        return false;
    }
    //Consumption
    _consume() {
        this.consumedAfterSnapshot++;
        return this.preprocessor.advance();
    }
    _advanceBy(count) {
        this.consumedAfterSnapshot += count;
        for (let i = 0; i < count; i++) {
            this.preprocessor.advance();
        }
    }
    _consumeSequenceIfMatch(pattern, caseSensitive) {
        if (this.preprocessor.startsWith(pattern, caseSensitive)) {
            // We will already have consumed one character before calling this method.
            this._advanceBy(pattern.length - 1);
            return true;
        }
        return false;
    }
    //Token creation
    _createStartTagToken() {
        this.currentToken = {
            type: TokenType.START_TAG,
            tagName: '',
            tagID: TAG_ID.UNKNOWN,
            selfClosing: false,
            ackSelfClosing: false,
            attrs: [],
            location: this.getCurrentLocation(1),
        };
    }
    _createEndTagToken() {
        this.currentToken = {
            type: TokenType.END_TAG,
            tagName: '',
            tagID: TAG_ID.UNKNOWN,
            selfClosing: false,
            ackSelfClosing: false,
            attrs: [],
            location: this.getCurrentLocation(2),
        };
    }
    _createCommentToken(offset) {
        this.currentToken = {
            type: TokenType.COMMENT,
            data: '',
            location: this.getCurrentLocation(offset),
        };
    }
    _createDoctypeToken(initialName) {
        this.currentToken = {
            type: TokenType.DOCTYPE,
            name: initialName,
            forceQuirks: false,
            publicId: null,
            systemId: null,
            location: this.currentLocation,
        };
    }
    _createCharacterToken(type, chars) {
        this.currentCharacterToken = {
            type,
            chars,
            location: this.currentLocation,
        };
    }
    //Tag attributes
    _createAttr(attrNameFirstCh) {
        this.currentAttr = {
            name: attrNameFirstCh,
            value: '',
        };
        this.currentLocation = this.getCurrentLocation(0);
    }
    _leaveAttrName() {
        var _a;
        var _b;
        const token = this.currentToken;
        if (getTokenAttr(token, this.currentAttr.name) === null) {
            token.attrs.push(this.currentAttr);
            if (token.location && this.currentLocation) {
                const attrLocations = ((_a = (_b = token.location).attrs) !== null && _a !== void 0 ? _a : (_b.attrs = Object.create(null)));
                attrLocations[this.currentAttr.name] = this.currentLocation;
                // Set end location
                this._leaveAttrValue();
            }
        }
        else {
            this._err(ERR.duplicateAttribute);
        }
    }
    _leaveAttrValue() {
        if (this.currentLocation) {
            this.currentLocation.endLine = this.preprocessor.line;
            this.currentLocation.endCol = this.preprocessor.col;
            this.currentLocation.endOffset = this.preprocessor.offset;
        }
    }
    //Token emission
    prepareToken(ct) {
        this._emitCurrentCharacterToken(ct.location);
        this.currentToken = null;
        if (ct.location) {
            ct.location.endLine = this.preprocessor.line;
            ct.location.endCol = this.preprocessor.col + 1;
            ct.location.endOffset = this.preprocessor.offset + 1;
        }
        this.currentLocation = this.getCurrentLocation(-1);
    }
    emitCurrentTagToken() {
        const ct = this.currentToken;
        this.prepareToken(ct);
        ct.tagID = getTagID(ct.tagName);
        if (ct.type === TokenType.START_TAG) {
            this.lastStartTagName = ct.tagName;
            this.handler.onStartTag(ct);
        }
        else {
            if (ct.attrs.length > 0) {
                this._err(ERR.endTagWithAttributes);
            }
            if (ct.selfClosing) {
                this._err(ERR.endTagWithTrailingSolidus);
            }
            this.handler.onEndTag(ct);
        }
        this.preprocessor.dropParsedChunk();
    }
    emitCurrentComment(ct) {
        this.prepareToken(ct);
        this.handler.onComment(ct);
        this.preprocessor.dropParsedChunk();
    }
    emitCurrentDoctype(ct) {
        this.prepareToken(ct);
        this.handler.onDoctype(ct);
        this.preprocessor.dropParsedChunk();
    }
    _emitCurrentCharacterToken(nextLocation) {
        if (this.currentCharacterToken) {
            //NOTE: if we have a pending character token, make it's end location equal to the
            //current token's start location.
            if (nextLocation && this.currentCharacterToken.location) {
                this.currentCharacterToken.location.endLine = nextLocation.startLine;
                this.currentCharacterToken.location.endCol = nextLocation.startCol;
                this.currentCharacterToken.location.endOffset = nextLocation.startOffset;
            }
            switch (this.currentCharacterToken.type) {
                case TokenType.CHARACTER: {
                    this.handler.onCharacter(this.currentCharacterToken);
                    break;
                }
                case TokenType.NULL_CHARACTER: {
                    this.handler.onNullCharacter(this.currentCharacterToken);
                    break;
                }
                case TokenType.WHITESPACE_CHARACTER: {
                    this.handler.onWhitespaceCharacter(this.currentCharacterToken);
                    break;
                }
            }
            this.currentCharacterToken = null;
        }
    }
    _emitEOFToken() {
        const location = this.getCurrentLocation(0);
        if (location) {
            location.endLine = location.startLine;
            location.endCol = location.startCol;
            location.endOffset = location.startOffset;
        }
        this._emitCurrentCharacterToken(location);
        this.handler.onEof({ type: TokenType.EOF, location });
        this.active = false;
    }
    //Characters emission
    //OPTIMIZATION: The specification uses only one type of character token (one token per character).
    //This causes a huge memory overhead and a lot of unnecessary parser loops. parse5 uses 3 groups of characters.
    //If we have a sequence of characters that belong to the same group, the parser can process it
    //as a single solid character token.
    //So, there are 3 types of character tokens in parse5:
    //1)TokenType.NULL_CHARACTER - \u0000-character sequences (e.g. '\u0000\u0000\u0000')
    //2)TokenType.WHITESPACE_CHARACTER - any whitespace/new-line character sequences (e.g. '\n  \r\t   \f')
    //3)TokenType.CHARACTER - any character sequence which don't belong to groups 1 and 2 (e.g. 'abcdef1234@@#$%^')
    _appendCharToCurrentCharacterToken(type, ch) {
        if (this.currentCharacterToken) {
            if (this.currentCharacterToken.type === type) {
                this.currentCharacterToken.chars += ch;
                return;
            }
            else {
                this.currentLocation = this.getCurrentLocation(0);
                this._emitCurrentCharacterToken(this.currentLocation);
                this.preprocessor.dropParsedChunk();
            }
        }
        this._createCharacterToken(type, ch);
    }
    _emitCodePoint(cp) {
        const type = isWhitespace(cp)
            ? TokenType.WHITESPACE_CHARACTER
            : cp === CODE_POINTS.NULL
                ? TokenType.NULL_CHARACTER
                : TokenType.CHARACTER;
        this._appendCharToCurrentCharacterToken(type, String.fromCodePoint(cp));
    }
    //NOTE: used when we emit characters explicitly.
    //This is always for non-whitespace and non-null characters, which allows us to avoid additional checks.
    _emitChars(ch) {
        this._appendCharToCurrentCharacterToken(TokenType.CHARACTER, ch);
    }
    // Character reference helpers
    _startCharacterReference() {
        this.returnState = this.state;
        this.state = State.CHARACTER_REFERENCE;
        this.entityStartPos = this.preprocessor.pos;
        this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute() ? DecodingMode.Attribute : DecodingMode.Legacy);
    }
    _isCharacterReferenceInAttribute() {
        return (this.returnState === State.ATTRIBUTE_VALUE_DOUBLE_QUOTED ||
            this.returnState === State.ATTRIBUTE_VALUE_SINGLE_QUOTED ||
            this.returnState === State.ATTRIBUTE_VALUE_UNQUOTED);
    }
    _flushCodePointConsumedAsCharacterReference(cp) {
        if (this._isCharacterReferenceInAttribute()) {
            this.currentAttr.value += String.fromCodePoint(cp);
        }
        else {
            this._emitCodePoint(cp);
        }
    }
    // Calling states this way turns out to be much faster than any other approach.
    _callState(cp) {
        switch (this.state) {
            case State.DATA: {
                this._stateData(cp);
                break;
            }
            case State.RCDATA: {
                this._stateRcdata(cp);
                break;
            }
            case State.RAWTEXT: {
                this._stateRawtext(cp);
                break;
            }
            case State.SCRIPT_DATA: {
                this._stateScriptData(cp);
                break;
            }
            case State.PLAINTEXT: {
                this._statePlaintext(cp);
                break;
            }
            case State.TAG_OPEN: {
                this._stateTagOpen(cp);
                break;
            }
            case State.END_TAG_OPEN: {
                this._stateEndTagOpen(cp);
                break;
            }
            case State.TAG_NAME: {
                this._stateTagName(cp);
                break;
            }
            case State.RCDATA_LESS_THAN_SIGN: {
                this._stateRcdataLessThanSign(cp);
                break;
            }
            case State.RCDATA_END_TAG_OPEN: {
                this._stateRcdataEndTagOpen(cp);
                break;
            }
            case State.RCDATA_END_TAG_NAME: {
                this._stateRcdataEndTagName(cp);
                break;
            }
            case State.RAWTEXT_LESS_THAN_SIGN: {
                this._stateRawtextLessThanSign(cp);
                break;
            }
            case State.RAWTEXT_END_TAG_OPEN: {
                this._stateRawtextEndTagOpen(cp);
                break;
            }
            case State.RAWTEXT_END_TAG_NAME: {
                this._stateRawtextEndTagName(cp);
                break;
            }
            case State.SCRIPT_DATA_LESS_THAN_SIGN: {
                this._stateScriptDataLessThanSign(cp);
                break;
            }
            case State.SCRIPT_DATA_END_TAG_OPEN: {
                this._stateScriptDataEndTagOpen(cp);
                break;
            }
            case State.SCRIPT_DATA_END_TAG_NAME: {
                this._stateScriptDataEndTagName(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPE_START: {
                this._stateScriptDataEscapeStart(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPE_START_DASH: {
                this._stateScriptDataEscapeStartDash(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED: {
                this._stateScriptDataEscaped(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED_DASH: {
                this._stateScriptDataEscapedDash(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED_DASH_DASH: {
                this._stateScriptDataEscapedDashDash(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN: {
                this._stateScriptDataEscapedLessThanSign(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN: {
                this._stateScriptDataEscapedEndTagOpen(cp);
                break;
            }
            case State.SCRIPT_DATA_ESCAPED_END_TAG_NAME: {
                this._stateScriptDataEscapedEndTagName(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPE_START: {
                this._stateScriptDataDoubleEscapeStart(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPED: {
                this._stateScriptDataDoubleEscaped(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH: {
                this._stateScriptDataDoubleEscapedDash(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH: {
                this._stateScriptDataDoubleEscapedDashDash(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN: {
                this._stateScriptDataDoubleEscapedLessThanSign(cp);
                break;
            }
            case State.SCRIPT_DATA_DOUBLE_ESCAPE_END: {
                this._stateScriptDataDoubleEscapeEnd(cp);
                break;
            }
            case State.BEFORE_ATTRIBUTE_NAME: {
                this._stateBeforeAttributeName(cp);
                break;
            }
            case State.ATTRIBUTE_NAME: {
                this._stateAttributeName(cp);
                break;
            }
            case State.AFTER_ATTRIBUTE_NAME: {
                this._stateAfterAttributeName(cp);
                break;
            }
            case State.BEFORE_ATTRIBUTE_VALUE: {
                this._stateBeforeAttributeValue(cp);
                break;
            }
            case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED: {
                this._stateAttributeValueDoubleQuoted(cp);
                break;
            }
            case State.ATTRIBUTE_VALUE_SINGLE_QUOTED: {
                this._stateAttributeValueSingleQuoted(cp);
                break;
            }
            case State.ATTRIBUTE_VALUE_UNQUOTED: {
                this._stateAttributeValueUnquoted(cp);
                break;
            }
            case State.AFTER_ATTRIBUTE_VALUE_QUOTED: {
                this._stateAfterAttributeValueQuoted(cp);
                break;
            }
            case State.SELF_CLOSING_START_TAG: {
                this._stateSelfClosingStartTag(cp);
                break;
            }
            case State.BOGUS_COMMENT: {
                this._stateBogusComment(cp);
                break;
            }
            case State.MARKUP_DECLARATION_OPEN: {
                this._stateMarkupDeclarationOpen(cp);
                break;
            }
            case State.COMMENT_START: {
                this._stateCommentStart(cp);
                break;
            }
            case State.COMMENT_START_DASH: {
                this._stateCommentStartDash(cp);
                break;
            }
            case State.COMMENT: {
                this._stateComment(cp);
                break;
            }
            case State.COMMENT_LESS_THAN_SIGN: {
                this._stateCommentLessThanSign(cp);
                break;
            }
            case State.COMMENT_LESS_THAN_SIGN_BANG: {
                this._stateCommentLessThanSignBang(cp);
                break;
            }
            case State.COMMENT_LESS_THAN_SIGN_BANG_DASH: {
                this._stateCommentLessThanSignBangDash(cp);
                break;
            }
            case State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH: {
                this._stateCommentLessThanSignBangDashDash(cp);
                break;
            }
            case State.COMMENT_END_DASH: {
                this._stateCommentEndDash(cp);
                break;
            }
            case State.COMMENT_END: {
                this._stateCommentEnd(cp);
                break;
            }
            case State.COMMENT_END_BANG: {
                this._stateCommentEndBang(cp);
                break;
            }
            case State.DOCTYPE: {
                this._stateDoctype(cp);
                break;
            }
            case State.BEFORE_DOCTYPE_NAME: {
                this._stateBeforeDoctypeName(cp);
                break;
            }
            case State.DOCTYPE_NAME: {
                this._stateDoctypeName(cp);
                break;
            }
            case State.AFTER_DOCTYPE_NAME: {
                this._stateAfterDoctypeName(cp);
                break;
            }
            case State.AFTER_DOCTYPE_PUBLIC_KEYWORD: {
                this._stateAfterDoctypePublicKeyword(cp);
                break;
            }
            case State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER: {
                this._stateBeforeDoctypePublicIdentifier(cp);
                break;
            }
            case State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED: {
                this._stateDoctypePublicIdentifierDoubleQuoted(cp);
                break;
            }
            case State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED: {
                this._stateDoctypePublicIdentifierSingleQuoted(cp);
                break;
            }
            case State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER: {
                this._stateAfterDoctypePublicIdentifier(cp);
                break;
            }
            case State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS: {
                this._stateBetweenDoctypePublicAndSystemIdentifiers(cp);
                break;
            }
            case State.AFTER_DOCTYPE_SYSTEM_KEYWORD: {
                this._stateAfterDoctypeSystemKeyword(cp);
                break;
            }
            case State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER: {
                this._stateBeforeDoctypeSystemIdentifier(cp);
                break;
            }
            case State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED: {
                this._stateDoctypeSystemIdentifierDoubleQuoted(cp);
                break;
            }
            case State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED: {
                this._stateDoctypeSystemIdentifierSingleQuoted(cp);
                break;
            }
            case State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER: {
                this._stateAfterDoctypeSystemIdentifier(cp);
                break;
            }
            case State.BOGUS_DOCTYPE: {
                this._stateBogusDoctype(cp);
                break;
            }
            case State.CDATA_SECTION: {
                this._stateCdataSection(cp);
                break;
            }
            case State.CDATA_SECTION_BRACKET: {
                this._stateCdataSectionBracket(cp);
                break;
            }
            case State.CDATA_SECTION_END: {
                this._stateCdataSectionEnd(cp);
                break;
            }
            case State.CHARACTER_REFERENCE: {
                this._stateCharacterReference();
                break;
            }
            case State.AMBIGUOUS_AMPERSAND: {
                this._stateAmbiguousAmpersand(cp);
                break;
            }
            default: {
                throw new Error('Unknown state');
            }
        }
    }
    // State machine
    // Data state
    //------------------------------------------------------------------
    _stateData(cp) {
        switch (cp) {
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.TAG_OPEN;
                break;
            }
            case CODE_POINTS.AMPERSAND: {
                this._startCharacterReference();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitCodePoint(cp);
                break;
            }
            case CODE_POINTS.EOF: {
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    //  RCDATA state
    //------------------------------------------------------------------
    _stateRcdata(cp) {
        switch (cp) {
            case CODE_POINTS.AMPERSAND: {
                this._startCharacterReference();
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.RCDATA_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // RAWTEXT state
    //------------------------------------------------------------------
    _stateRawtext(cp) {
        switch (cp) {
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.RAWTEXT_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data state
    //------------------------------------------------------------------
    _stateScriptData(cp) {
        switch (cp) {
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // PLAINTEXT state
    //------------------------------------------------------------------
    _statePlaintext(cp) {
        switch (cp) {
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // Tag open state
    //------------------------------------------------------------------
    _stateTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this._createStartTagToken();
            this.state = State.TAG_NAME;
            this._stateTagName(cp);
        }
        else
            switch (cp) {
                case CODE_POINTS.EXCLAMATION_MARK: {
                    this.state = State.MARKUP_DECLARATION_OPEN;
                    break;
                }
                case CODE_POINTS.SOLIDUS: {
                    this.state = State.END_TAG_OPEN;
                    break;
                }
                case CODE_POINTS.QUESTION_MARK: {
                    this._err(ERR.unexpectedQuestionMarkInsteadOfTagName);
                    this._createCommentToken(1);
                    this.state = State.BOGUS_COMMENT;
                    this._stateBogusComment(cp);
                    break;
                }
                case CODE_POINTS.EOF: {
                    this._err(ERR.eofBeforeTagName);
                    this._emitChars('<');
                    this._emitEOFToken();
                    break;
                }
                default: {
                    this._err(ERR.invalidFirstCharacterOfTagName);
                    this._emitChars('<');
                    this.state = State.DATA;
                    this._stateData(cp);
                }
            }
    }
    // End tag open state
    //------------------------------------------------------------------
    _stateEndTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this.state = State.TAG_NAME;
            this._stateTagName(cp);
        }
        else
            switch (cp) {
                case CODE_POINTS.GREATER_THAN_SIGN: {
                    this._err(ERR.missingEndTagName);
                    this.state = State.DATA;
                    break;
                }
                case CODE_POINTS.EOF: {
                    this._err(ERR.eofBeforeTagName);
                    this._emitChars('</');
                    this._emitEOFToken();
                    break;
                }
                default: {
                    this._err(ERR.invalidFirstCharacterOfTagName);
                    this._createCommentToken(2);
                    this.state = State.BOGUS_COMMENT;
                    this._stateBogusComment(cp);
                }
            }
    }
    // Tag name state
    //------------------------------------------------------------------
    _stateTagName(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                break;
            }
            case CODE_POINTS.SOLIDUS: {
                this.state = State.SELF_CLOSING_START_TAG;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.tagName += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                token.tagName += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
            }
        }
    }
    // RCDATA less-than sign state
    //------------------------------------------------------------------
    _stateRcdataLessThanSign(cp) {
        if (cp === CODE_POINTS.SOLIDUS) {
            this.state = State.RCDATA_END_TAG_OPEN;
        }
        else {
            this._emitChars('<');
            this.state = State.RCDATA;
            this._stateRcdata(cp);
        }
    }
    // RCDATA end tag open state
    //------------------------------------------------------------------
    _stateRcdataEndTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this.state = State.RCDATA_END_TAG_NAME;
            this._stateRcdataEndTagName(cp);
        }
        else {
            this._emitChars('</');
            this.state = State.RCDATA;
            this._stateRcdata(cp);
        }
    }
    handleSpecialEndTag(_cp) {
        if (!this.preprocessor.startsWith(this.lastStartTagName, false)) {
            return !this._ensureHibernation();
        }
        this._createEndTagToken();
        const token = this.currentToken;
        token.tagName = this.lastStartTagName;
        const cp = this.preprocessor.peek(this.lastStartTagName.length);
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this._advanceBy(this.lastStartTagName.length);
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                return false;
            }
            case CODE_POINTS.SOLIDUS: {
                this._advanceBy(this.lastStartTagName.length);
                this.state = State.SELF_CLOSING_START_TAG;
                return false;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._advanceBy(this.lastStartTagName.length);
                this.emitCurrentTagToken();
                this.state = State.DATA;
                return false;
            }
            default: {
                return !this._ensureHibernation();
            }
        }
    }
    // RCDATA end tag name state
    //------------------------------------------------------------------
    _stateRcdataEndTagName(cp) {
        if (this.handleSpecialEndTag(cp)) {
            this._emitChars('</');
            this.state = State.RCDATA;
            this._stateRcdata(cp);
        }
    }
    // RAWTEXT less-than sign state
    //------------------------------------------------------------------
    _stateRawtextLessThanSign(cp) {
        if (cp === CODE_POINTS.SOLIDUS) {
            this.state = State.RAWTEXT_END_TAG_OPEN;
        }
        else {
            this._emitChars('<');
            this.state = State.RAWTEXT;
            this._stateRawtext(cp);
        }
    }
    // RAWTEXT end tag open state
    //------------------------------------------------------------------
    _stateRawtextEndTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this.state = State.RAWTEXT_END_TAG_NAME;
            this._stateRawtextEndTagName(cp);
        }
        else {
            this._emitChars('</');
            this.state = State.RAWTEXT;
            this._stateRawtext(cp);
        }
    }
    // RAWTEXT end tag name state
    //------------------------------------------------------------------
    _stateRawtextEndTagName(cp) {
        if (this.handleSpecialEndTag(cp)) {
            this._emitChars('</');
            this.state = State.RAWTEXT;
            this._stateRawtext(cp);
        }
    }
    // Script data less-than sign state
    //------------------------------------------------------------------
    _stateScriptDataLessThanSign(cp) {
        switch (cp) {
            case CODE_POINTS.SOLIDUS: {
                this.state = State.SCRIPT_DATA_END_TAG_OPEN;
                break;
            }
            case CODE_POINTS.EXCLAMATION_MARK: {
                this.state = State.SCRIPT_DATA_ESCAPE_START;
                this._emitChars('<!');
                break;
            }
            default: {
                this._emitChars('<');
                this.state = State.SCRIPT_DATA;
                this._stateScriptData(cp);
            }
        }
    }
    // Script data end tag open state
    //------------------------------------------------------------------
    _stateScriptDataEndTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this.state = State.SCRIPT_DATA_END_TAG_NAME;
            this._stateScriptDataEndTagName(cp);
        }
        else {
            this._emitChars('</');
            this.state = State.SCRIPT_DATA;
            this._stateScriptData(cp);
        }
    }
    // Script data end tag name state
    //------------------------------------------------------------------
    _stateScriptDataEndTagName(cp) {
        if (this.handleSpecialEndTag(cp)) {
            this._emitChars('</');
            this.state = State.SCRIPT_DATA;
            this._stateScriptData(cp);
        }
    }
    // Script data escape start state
    //------------------------------------------------------------------
    _stateScriptDataEscapeStart(cp) {
        if (cp === CODE_POINTS.HYPHEN_MINUS) {
            this.state = State.SCRIPT_DATA_ESCAPE_START_DASH;
            this._emitChars('-');
        }
        else {
            this.state = State.SCRIPT_DATA;
            this._stateScriptData(cp);
        }
    }
    // Script data escape start dash state
    //------------------------------------------------------------------
    _stateScriptDataEscapeStartDash(cp) {
        if (cp === CODE_POINTS.HYPHEN_MINUS) {
            this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
            this._emitChars('-');
        }
        else {
            this.state = State.SCRIPT_DATA;
            this._stateScriptData(cp);
        }
    }
    // Script data escaped state
    //------------------------------------------------------------------
    _stateScriptDataEscaped(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.SCRIPT_DATA_ESCAPED_DASH;
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data escaped dash state
    //------------------------------------------------------------------
    _stateScriptDataEscapedDash(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.state = State.SCRIPT_DATA_ESCAPED;
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this.state = State.SCRIPT_DATA_ESCAPED;
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data escaped dash dash state
    //------------------------------------------------------------------
    _stateScriptDataEscapedDashDash(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.SCRIPT_DATA;
                this._emitChars('>');
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.state = State.SCRIPT_DATA_ESCAPED;
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this.state = State.SCRIPT_DATA_ESCAPED;
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data escaped less-than sign state
    //------------------------------------------------------------------
    _stateScriptDataEscapedLessThanSign(cp) {
        if (cp === CODE_POINTS.SOLIDUS) {
            this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;
        }
        else if (isAsciiLetter(cp)) {
            this._emitChars('<');
            this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_START;
            this._stateScriptDataDoubleEscapeStart(cp);
        }
        else {
            this._emitChars('<');
            this.state = State.SCRIPT_DATA_ESCAPED;
            this._stateScriptDataEscaped(cp);
        }
    }
    // Script data escaped end tag open state
    //------------------------------------------------------------------
    _stateScriptDataEscapedEndTagOpen(cp) {
        if (isAsciiLetter(cp)) {
            this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_NAME;
            this._stateScriptDataEscapedEndTagName(cp);
        }
        else {
            this._emitChars('</');
            this.state = State.SCRIPT_DATA_ESCAPED;
            this._stateScriptDataEscaped(cp);
        }
    }
    // Script data escaped end tag name state
    //------------------------------------------------------------------
    _stateScriptDataEscapedEndTagName(cp) {
        if (this.handleSpecialEndTag(cp)) {
            this._emitChars('</');
            this.state = State.SCRIPT_DATA_ESCAPED;
            this._stateScriptDataEscaped(cp);
        }
    }
    // Script data double escape start state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscapeStart(cp) {
        if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) &&
            isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
            this._emitCodePoint(cp);
            for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) {
                this._emitCodePoint(this._consume());
            }
            this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
        }
        else if (!this._ensureHibernation()) {
            this.state = State.SCRIPT_DATA_ESCAPED;
            this._stateScriptDataEscaped(cp);
        }
    }
    // Script data double escaped state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscaped(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH;
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                this._emitChars('<');
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data double escaped dash state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscapedDash(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH;
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                this._emitChars('<');
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data double escaped dash dash state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscapedDashDash(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this._emitChars('-');
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                this._emitChars('<');
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.SCRIPT_DATA;
                this._emitChars('>');
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
                this._emitChars(REPLACEMENT_CHARACTER);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInScriptHtmlCommentLikeText);
                this._emitEOFToken();
                break;
            }
            default: {
                this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
                this._emitCodePoint(cp);
            }
        }
    }
    // Script data double escaped less-than sign state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscapedLessThanSign(cp) {
        if (cp === CODE_POINTS.SOLIDUS) {
            this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_END;
            this._emitChars('/');
        }
        else {
            this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
            this._stateScriptDataDoubleEscaped(cp);
        }
    }
    // Script data double escape end state
    //------------------------------------------------------------------
    _stateScriptDataDoubleEscapeEnd(cp) {
        if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) &&
            isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
            this._emitCodePoint(cp);
            for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) {
                this._emitCodePoint(this._consume());
            }
            this.state = State.SCRIPT_DATA_ESCAPED;
        }
        else if (!this._ensureHibernation()) {
            this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
            this._stateScriptDataDoubleEscaped(cp);
        }
    }
    // Before attribute name state
    //------------------------------------------------------------------
    _stateBeforeAttributeName(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.SOLIDUS:
            case CODE_POINTS.GREATER_THAN_SIGN:
            case CODE_POINTS.EOF: {
                this.state = State.AFTER_ATTRIBUTE_NAME;
                this._stateAfterAttributeName(cp);
                break;
            }
            case CODE_POINTS.EQUALS_SIGN: {
                this._err(ERR.unexpectedEqualsSignBeforeAttributeName);
                this._createAttr('=');
                this.state = State.ATTRIBUTE_NAME;
                break;
            }
            default: {
                this._createAttr('');
                this.state = State.ATTRIBUTE_NAME;
                this._stateAttributeName(cp);
            }
        }
    }
    // Attribute name state
    //------------------------------------------------------------------
    _stateAttributeName(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED:
            case CODE_POINTS.SOLIDUS:
            case CODE_POINTS.GREATER_THAN_SIGN:
            case CODE_POINTS.EOF: {
                this._leaveAttrName();
                this.state = State.AFTER_ATTRIBUTE_NAME;
                this._stateAfterAttributeName(cp);
                break;
            }
            case CODE_POINTS.EQUALS_SIGN: {
                this._leaveAttrName();
                this.state = State.BEFORE_ATTRIBUTE_VALUE;
                break;
            }
            case CODE_POINTS.QUOTATION_MARK:
            case CODE_POINTS.APOSTROPHE:
            case CODE_POINTS.LESS_THAN_SIGN: {
                this._err(ERR.unexpectedCharacterInAttributeName);
                this.currentAttr.name += String.fromCodePoint(cp);
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.currentAttr.name += REPLACEMENT_CHARACTER;
                break;
            }
            default: {
                this.currentAttr.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
            }
        }
    }
    // After attribute name state
    //------------------------------------------------------------------
    _stateAfterAttributeName(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.SOLIDUS: {
                this.state = State.SELF_CLOSING_START_TAG;
                break;
            }
            case CODE_POINTS.EQUALS_SIGN: {
                this.state = State.BEFORE_ATTRIBUTE_VALUE;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this._createAttr('');
                this.state = State.ATTRIBUTE_NAME;
                this._stateAttributeName(cp);
            }
        }
    }
    // Before attribute value state
    //------------------------------------------------------------------
    _stateBeforeAttributeValue(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.missingAttributeValue);
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            default: {
                this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
                this._stateAttributeValueUnquoted(cp);
            }
        }
    }
    // Attribute value (double-quoted) state
    //------------------------------------------------------------------
    _stateAttributeValueDoubleQuoted(cp) {
        switch (cp) {
            case CODE_POINTS.QUOTATION_MARK: {
                this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
                break;
            }
            case CODE_POINTS.AMPERSAND: {
                this._startCharacterReference();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.currentAttr.value += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this.currentAttr.value += String.fromCodePoint(cp);
            }
        }
    }
    // Attribute value (single-quoted) state
    //------------------------------------------------------------------
    _stateAttributeValueSingleQuoted(cp) {
        switch (cp) {
            case CODE_POINTS.APOSTROPHE: {
                this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
                break;
            }
            case CODE_POINTS.AMPERSAND: {
                this._startCharacterReference();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.currentAttr.value += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this.currentAttr.value += String.fromCodePoint(cp);
            }
        }
    }
    // Attribute value (unquoted) state
    //------------------------------------------------------------------
    _stateAttributeValueUnquoted(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this._leaveAttrValue();
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                break;
            }
            case CODE_POINTS.AMPERSAND: {
                this._startCharacterReference();
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._leaveAttrValue();
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                this.currentAttr.value += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.QUOTATION_MARK:
            case CODE_POINTS.APOSTROPHE:
            case CODE_POINTS.LESS_THAN_SIGN:
            case CODE_POINTS.EQUALS_SIGN:
            case CODE_POINTS.GRAVE_ACCENT: {
                this._err(ERR.unexpectedCharacterInUnquotedAttributeValue);
                this.currentAttr.value += String.fromCodePoint(cp);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this.currentAttr.value += String.fromCodePoint(cp);
            }
        }
    }
    // After attribute value (quoted) state
    //------------------------------------------------------------------
    _stateAfterAttributeValueQuoted(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this._leaveAttrValue();
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                break;
            }
            case CODE_POINTS.SOLIDUS: {
                this._leaveAttrValue();
                this.state = State.SELF_CLOSING_START_TAG;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._leaveAttrValue();
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingWhitespaceBetweenAttributes);
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                this._stateBeforeAttributeName(cp);
            }
        }
    }
    // Self-closing start tag state
    //------------------------------------------------------------------
    _stateSelfClosingStartTag(cp) {
        switch (cp) {
            case CODE_POINTS.GREATER_THAN_SIGN: {
                const token = this.currentToken;
                token.selfClosing = true;
                this.state = State.DATA;
                this.emitCurrentTagToken();
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInTag);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.unexpectedSolidusInTag);
                this.state = State.BEFORE_ATTRIBUTE_NAME;
                this._stateBeforeAttributeName(cp);
            }
        }
    }
    // Bogus comment state
    //------------------------------------------------------------------
    _stateBogusComment(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentComment(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.data += REPLACEMENT_CHARACTER;
                break;
            }
            default: {
                token.data += String.fromCodePoint(cp);
            }
        }
    }
    // Markup declaration open state
    //------------------------------------------------------------------
    _stateMarkupDeclarationOpen(cp) {
        if (this._consumeSequenceIfMatch(SEQUENCES.DASH_DASH, true)) {
            this._createCommentToken(SEQUENCES.DASH_DASH.length + 1);
            this.state = State.COMMENT_START;
        }
        else if (this._consumeSequenceIfMatch(SEQUENCES.DOCTYPE, false)) {
            // NOTE: Doctypes tokens are created without fixed offsets. We keep track of the moment a doctype *might* start here.
            this.currentLocation = this.getCurrentLocation(SEQUENCES.DOCTYPE.length + 1);
            this.state = State.DOCTYPE;
        }
        else if (this._consumeSequenceIfMatch(SEQUENCES.CDATA_START, true)) {
            if (this.inForeignNode) {
                this.state = State.CDATA_SECTION;
            }
            else {
                this._err(ERR.cdataInHtmlContent);
                this._createCommentToken(SEQUENCES.CDATA_START.length + 1);
                this.currentToken.data = '[CDATA[';
                this.state = State.BOGUS_COMMENT;
            }
        }
        //NOTE: Sequence lookups can be abrupted by hibernation. In that case, lookup
        //results are no longer valid and we will need to start over.
        else if (!this._ensureHibernation()) {
            this._err(ERR.incorrectlyOpenedComment);
            this._createCommentToken(2);
            this.state = State.BOGUS_COMMENT;
            this._stateBogusComment(cp);
        }
    }
    // Comment start state
    //------------------------------------------------------------------
    _stateCommentStart(cp) {
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.COMMENT_START_DASH;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptClosingOfEmptyComment);
                this.state = State.DATA;
                const token = this.currentToken;
                this.emitCurrentComment(token);
                break;
            }
            default: {
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // Comment start dash state
    //------------------------------------------------------------------
    _stateCommentStartDash(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.COMMENT_END;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptClosingOfEmptyComment);
                this.state = State.DATA;
                this.emitCurrentComment(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInComment);
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.data += '-';
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // Comment state
    //------------------------------------------------------------------
    _stateComment(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.COMMENT_END_DASH;
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                token.data += '<';
                this.state = State.COMMENT_LESS_THAN_SIGN;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.data += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInComment);
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.data += String.fromCodePoint(cp);
            }
        }
    }
    // Comment less-than sign state
    //------------------------------------------------------------------
    _stateCommentLessThanSign(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.EXCLAMATION_MARK: {
                token.data += '!';
                this.state = State.COMMENT_LESS_THAN_SIGN_BANG;
                break;
            }
            case CODE_POINTS.LESS_THAN_SIGN: {
                token.data += '<';
                break;
            }
            default: {
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // Comment less-than sign bang state
    //------------------------------------------------------------------
    _stateCommentLessThanSignBang(cp) {
        if (cp === CODE_POINTS.HYPHEN_MINUS) {
            this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH;
        }
        else {
            this.state = State.COMMENT;
            this._stateComment(cp);
        }
    }
    // Comment less-than sign bang dash state
    //------------------------------------------------------------------
    _stateCommentLessThanSignBangDash(cp) {
        if (cp === CODE_POINTS.HYPHEN_MINUS) {
            this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;
        }
        else {
            this.state = State.COMMENT_END_DASH;
            this._stateCommentEndDash(cp);
        }
    }
    // Comment less-than sign bang dash dash state
    //------------------------------------------------------------------
    _stateCommentLessThanSignBangDashDash(cp) {
        if (cp !== CODE_POINTS.GREATER_THAN_SIGN && cp !== CODE_POINTS.EOF) {
            this._err(ERR.nestedComment);
        }
        this.state = State.COMMENT_END;
        this._stateCommentEnd(cp);
    }
    // Comment end dash state
    //------------------------------------------------------------------
    _stateCommentEndDash(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                this.state = State.COMMENT_END;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInComment);
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.data += '-';
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // Comment end state
    //------------------------------------------------------------------
    _stateCommentEnd(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentComment(token);
                break;
            }
            case CODE_POINTS.EXCLAMATION_MARK: {
                this.state = State.COMMENT_END_BANG;
                break;
            }
            case CODE_POINTS.HYPHEN_MINUS: {
                token.data += '-';
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInComment);
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.data += '--';
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // Comment end bang state
    //------------------------------------------------------------------
    _stateCommentEndBang(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.HYPHEN_MINUS: {
                token.data += '--!';
                this.state = State.COMMENT_END_DASH;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.incorrectlyClosedComment);
                this.state = State.DATA;
                this.emitCurrentComment(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInComment);
                this.emitCurrentComment(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.data += '--!';
                this.state = State.COMMENT;
                this._stateComment(cp);
            }
        }
    }
    // DOCTYPE state
    //------------------------------------------------------------------
    _stateDoctype(cp) {
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.BEFORE_DOCTYPE_NAME;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.BEFORE_DOCTYPE_NAME;
                this._stateBeforeDoctypeName(cp);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                this._createDoctypeToken(null);
                const token = this.currentToken;
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingWhitespaceBeforeDoctypeName);
                this.state = State.BEFORE_DOCTYPE_NAME;
                this._stateBeforeDoctypeName(cp);
            }
        }
    }
    // Before DOCTYPE name state
    //------------------------------------------------------------------
    _stateBeforeDoctypeName(cp) {
        if (isAsciiUpper(cp)) {
            this._createDoctypeToken(String.fromCharCode(toAsciiLower(cp)));
            this.state = State.DOCTYPE_NAME;
        }
        else
            switch (cp) {
                case CODE_POINTS.SPACE:
                case CODE_POINTS.LINE_FEED:
                case CODE_POINTS.TABULATION:
                case CODE_POINTS.FORM_FEED: {
                    // Ignore whitespace
                    break;
                }
                case CODE_POINTS.NULL: {
                    this._err(ERR.unexpectedNullCharacter);
                    this._createDoctypeToken(REPLACEMENT_CHARACTER);
                    this.state = State.DOCTYPE_NAME;
                    break;
                }
                case CODE_POINTS.GREATER_THAN_SIGN: {
                    this._err(ERR.missingDoctypeName);
                    this._createDoctypeToken(null);
                    const token = this.currentToken;
                    token.forceQuirks = true;
                    this.emitCurrentDoctype(token);
                    this.state = State.DATA;
                    break;
                }
                case CODE_POINTS.EOF: {
                    this._err(ERR.eofInDoctype);
                    this._createDoctypeToken(null);
                    const token = this.currentToken;
                    token.forceQuirks = true;
                    this.emitCurrentDoctype(token);
                    this._emitEOFToken();
                    break;
                }
                default: {
                    this._createDoctypeToken(String.fromCodePoint(cp));
                    this.state = State.DOCTYPE_NAME;
                }
            }
    }
    // DOCTYPE name state
    //------------------------------------------------------------------
    _stateDoctypeName(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.AFTER_DOCTYPE_NAME;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.name += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
            }
        }
    }
    // After DOCTYPE name state
    //------------------------------------------------------------------
    _stateAfterDoctypeName(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                if (this._consumeSequenceIfMatch(SEQUENCES.PUBLIC, false)) {
                    this.state = State.AFTER_DOCTYPE_PUBLIC_KEYWORD;
                }
                else if (this._consumeSequenceIfMatch(SEQUENCES.SYSTEM, false)) {
                    this.state = State.AFTER_DOCTYPE_SYSTEM_KEYWORD;
                }
                //NOTE: sequence lookup can be abrupted by hibernation. In that case lookup
                //results are no longer valid and we will need to start over.
                else if (!this._ensureHibernation()) {
                    this._err(ERR.invalidCharacterSequenceAfterDoctypeName);
                    token.forceQuirks = true;
                    this.state = State.BOGUS_DOCTYPE;
                    this._stateBogusDoctype(cp);
                }
            }
        }
    }
    // After DOCTYPE public keyword state
    //------------------------------------------------------------------
    _stateAfterDoctypePublicKeyword(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
                token.publicId = '';
                this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
                token.publicId = '';
                this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.missingDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // Before DOCTYPE public identifier state
    //------------------------------------------------------------------
    _stateBeforeDoctypePublicIdentifier(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                token.publicId = '';
                this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                token.publicId = '';
                this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.missingDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // DOCTYPE public identifier (double-quoted) state
    //------------------------------------------------------------------
    _stateDoctypePublicIdentifierDoubleQuoted(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.QUOTATION_MARK: {
                this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.publicId += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.publicId += String.fromCodePoint(cp);
            }
        }
    }
    // DOCTYPE public identifier (single-quoted) state
    //------------------------------------------------------------------
    _stateDoctypePublicIdentifierSingleQuoted(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.APOSTROPHE: {
                this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.publicId += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptDoctypePublicIdentifier);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.publicId += String.fromCodePoint(cp);
            }
        }
    }
    // After DOCTYPE public identifier state
    //------------------------------------------------------------------
    _stateAfterDoctypePublicIdentifier(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // Between DOCTYPE public and system identifiers state
    //------------------------------------------------------------------
    _stateBetweenDoctypePublicAndSystemIdentifiers(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // After DOCTYPE system keyword state
    //------------------------------------------------------------------
    _stateAfterDoctypeSystemKeyword(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                this.state = State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.missingDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // Before DOCTYPE system identifier state
    //------------------------------------------------------------------
    _stateBeforeDoctypeSystemIdentifier(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.QUOTATION_MARK: {
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
                break;
            }
            case CODE_POINTS.APOSTROPHE: {
                token.systemId = '';
                this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.missingDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.DATA;
                this.emitCurrentDoctype(token);
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // DOCTYPE system identifier (double-quoted) state
    //------------------------------------------------------------------
    _stateDoctypeSystemIdentifierDoubleQuoted(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.QUOTATION_MARK: {
                this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.systemId += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.systemId += String.fromCodePoint(cp);
            }
        }
    }
    // DOCTYPE system identifier (single-quoted) state
    //------------------------------------------------------------------
    _stateDoctypeSystemIdentifierSingleQuoted(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.APOSTROPHE: {
                this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                token.systemId += REPLACEMENT_CHARACTER;
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this._err(ERR.abruptDoctypeSystemIdentifier);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                token.systemId += String.fromCodePoint(cp);
            }
        }
    }
    // After DOCTYPE system identifier state
    //------------------------------------------------------------------
    _stateAfterDoctypeSystemIdentifier(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.SPACE:
            case CODE_POINTS.LINE_FEED:
            case CODE_POINTS.TABULATION:
            case CODE_POINTS.FORM_FEED: {
                // Ignore whitespace
                break;
            }
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInDoctype);
                token.forceQuirks = true;
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default: {
                this._err(ERR.unexpectedCharacterAfterDoctypeSystemIdentifier);
                this.state = State.BOGUS_DOCTYPE;
                this._stateBogusDoctype(cp);
            }
        }
    }
    // Bogus DOCTYPE state
    //------------------------------------------------------------------
    _stateBogusDoctype(cp) {
        const token = this.currentToken;
        switch (cp) {
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.emitCurrentDoctype(token);
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.NULL: {
                this._err(ERR.unexpectedNullCharacter);
                break;
            }
            case CODE_POINTS.EOF: {
                this.emitCurrentDoctype(token);
                this._emitEOFToken();
                break;
            }
            default:
            // Do nothing
        }
    }
    // CDATA section state
    //------------------------------------------------------------------
    _stateCdataSection(cp) {
        switch (cp) {
            case CODE_POINTS.RIGHT_SQUARE_BRACKET: {
                this.state = State.CDATA_SECTION_BRACKET;
                break;
            }
            case CODE_POINTS.EOF: {
                this._err(ERR.eofInCdata);
                this._emitEOFToken();
                break;
            }
            default: {
                this._emitCodePoint(cp);
            }
        }
    }
    // CDATA section bracket state
    //------------------------------------------------------------------
    _stateCdataSectionBracket(cp) {
        if (cp === CODE_POINTS.RIGHT_SQUARE_BRACKET) {
            this.state = State.CDATA_SECTION_END;
        }
        else {
            this._emitChars(']');
            this.state = State.CDATA_SECTION;
            this._stateCdataSection(cp);
        }
    }
    // CDATA section end state
    //------------------------------------------------------------------
    _stateCdataSectionEnd(cp) {
        switch (cp) {
            case CODE_POINTS.GREATER_THAN_SIGN: {
                this.state = State.DATA;
                break;
            }
            case CODE_POINTS.RIGHT_SQUARE_BRACKET: {
                this._emitChars(']');
                break;
            }
            default: {
                this._emitChars(']]');
                this.state = State.CDATA_SECTION;
                this._stateCdataSection(cp);
            }
        }
    }
    // Character reference state
    //------------------------------------------------------------------
    _stateCharacterReference() {
        let length = this.entityDecoder.write(this.preprocessor.html, this.preprocessor.pos);
        if (length < 0) {
            if (this.preprocessor.lastChunkWritten) {
                length = this.entityDecoder.end();
            }
            else {
                // Wait for the rest of the entity.
                this.active = false;
                // Mark the entire buffer as read.
                this.preprocessor.pos = this.preprocessor.html.length - 1;
                this.consumedAfterSnapshot = 0;
                this.preprocessor.endOfChunkHit = true;
                return;
            }
        }
        if (length === 0) {
            // This was not a valid entity. Go back to the beginning, and
            // figure out what to do.
            this.preprocessor.pos = this.entityStartPos;
            this._flushCodePointConsumedAsCharacterReference(CODE_POINTS.AMPERSAND);
            this.state =
                !this._isCharacterReferenceInAttribute() && tokenizer_isAsciiAlphaNumeric(this.preprocessor.peek(1))
                    ? State.AMBIGUOUS_AMPERSAND
                    : this.returnState;
        }
        else {
            // We successfully parsed an entity. Switch to the return state.
            this.state = this.returnState;
        }
    }
    // Ambiguos ampersand state
    //------------------------------------------------------------------
    _stateAmbiguousAmpersand(cp) {
        if (tokenizer_isAsciiAlphaNumeric(cp)) {
            this._flushCodePointConsumedAsCharacterReference(cp);
        }
        else {
            if (cp === CODE_POINTS.SEMICOLON) {
                this._err(ERR.unknownNamedCharacterReference);
            }
            this.state = this.returnState;
            this._callState(cp);
        }
    }
}

;// ./node_modules/parse5/dist/parser/open-element-stack.js

//Element utils
const IMPLICIT_END_TAG_REQUIRED = new Set([TAG_ID.DD, TAG_ID.DT, TAG_ID.LI, TAG_ID.OPTGROUP, TAG_ID.OPTION, TAG_ID.P, TAG_ID.RB, TAG_ID.RP, TAG_ID.RT, TAG_ID.RTC]);
const IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = new Set([
    ...IMPLICIT_END_TAG_REQUIRED,
    TAG_ID.CAPTION,
    TAG_ID.COLGROUP,
    TAG_ID.TBODY,
    TAG_ID.TD,
    TAG_ID.TFOOT,
    TAG_ID.TH,
    TAG_ID.THEAD,
    TAG_ID.TR,
]);
const SCOPING_ELEMENTS_HTML = new Set([
    TAG_ID.APPLET,
    TAG_ID.CAPTION,
    TAG_ID.HTML,
    TAG_ID.MARQUEE,
    TAG_ID.OBJECT,
    TAG_ID.TABLE,
    TAG_ID.TD,
    TAG_ID.TEMPLATE,
    TAG_ID.TH,
]);
const SCOPING_ELEMENTS_HTML_LIST = new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.OL, TAG_ID.UL]);
const SCOPING_ELEMENTS_HTML_BUTTON = new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.BUTTON]);
const SCOPING_ELEMENTS_MATHML = new Set([TAG_ID.ANNOTATION_XML, TAG_ID.MI, TAG_ID.MN, TAG_ID.MO, TAG_ID.MS, TAG_ID.MTEXT]);
const SCOPING_ELEMENTS_SVG = new Set([TAG_ID.DESC, TAG_ID.FOREIGN_OBJECT, TAG_ID.TITLE]);
const TABLE_ROW_CONTEXT = new Set([TAG_ID.TR, TAG_ID.TEMPLATE, TAG_ID.HTML]);
const TABLE_BODY_CONTEXT = new Set([TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TEMPLATE, TAG_ID.HTML]);
const TABLE_CONTEXT = new Set([TAG_ID.TABLE, TAG_ID.TEMPLATE, TAG_ID.HTML]);
const TABLE_CELLS = new Set([TAG_ID.TD, TAG_ID.TH]);
//Stack of open elements
class OpenElementStack {
    get currentTmplContentOrNode() {
        return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
    }
    constructor(document, treeAdapter, handler) {
        this.treeAdapter = treeAdapter;
        this.handler = handler;
        this.items = [];
        this.tagIDs = [];
        this.stackTop = -1;
        this.tmplCount = 0;
        this.currentTagId = TAG_ID.UNKNOWN;
        this.current = document;
    }
    //Index of element
    _indexOf(element) {
        return this.items.lastIndexOf(element, this.stackTop);
    }
    //Update current element
    _isInTemplate() {
        return this.currentTagId === TAG_ID.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === NS.HTML;
    }
    _updateCurrentElement() {
        this.current = this.items[this.stackTop];
        this.currentTagId = this.tagIDs[this.stackTop];
    }
    //Mutations
    push(element, tagID) {
        this.stackTop++;
        this.items[this.stackTop] = element;
        this.current = element;
        this.tagIDs[this.stackTop] = tagID;
        this.currentTagId = tagID;
        if (this._isInTemplate()) {
            this.tmplCount++;
        }
        this.handler.onItemPush(element, tagID, true);
    }
    pop() {
        const popped = this.current;
        if (this.tmplCount > 0 && this._isInTemplate()) {
            this.tmplCount--;
        }
        this.stackTop--;
        this._updateCurrentElement();
        this.handler.onItemPop(popped, true);
    }
    replace(oldElement, newElement) {
        const idx = this._indexOf(oldElement);
        this.items[idx] = newElement;
        if (idx === this.stackTop) {
            this.current = newElement;
        }
    }
    insertAfter(referenceElement, newElement, newElementID) {
        const insertionIdx = this._indexOf(referenceElement) + 1;
        this.items.splice(insertionIdx, 0, newElement);
        this.tagIDs.splice(insertionIdx, 0, newElementID);
        this.stackTop++;
        if (insertionIdx === this.stackTop) {
            this._updateCurrentElement();
        }
        if (this.current && this.currentTagId !== undefined) {
            this.handler.onItemPush(this.current, this.currentTagId, insertionIdx === this.stackTop);
        }
    }
    popUntilTagNamePopped(tagName) {
        let targetIdx = this.stackTop + 1;
        do {
            targetIdx = this.tagIDs.lastIndexOf(tagName, targetIdx - 1);
        } while (targetIdx > 0 && this.treeAdapter.getNamespaceURI(this.items[targetIdx]) !== NS.HTML);
        this.shortenToLength(Math.max(targetIdx, 0));
    }
    shortenToLength(idx) {
        while (this.stackTop >= idx) {
            const popped = this.current;
            if (this.tmplCount > 0 && this._isInTemplate()) {
                this.tmplCount -= 1;
            }
            this.stackTop--;
            this._updateCurrentElement();
            this.handler.onItemPop(popped, this.stackTop < idx);
        }
    }
    popUntilElementPopped(element) {
        const idx = this._indexOf(element);
        this.shortenToLength(Math.max(idx, 0));
    }
    popUntilPopped(tagNames, targetNS) {
        const idx = this._indexOfTagNames(tagNames, targetNS);
        this.shortenToLength(Math.max(idx, 0));
    }
    popUntilNumberedHeaderPopped() {
        this.popUntilPopped(NUMBERED_HEADERS, NS.HTML);
    }
    popUntilTableCellPopped() {
        this.popUntilPopped(TABLE_CELLS, NS.HTML);
    }
    popAllUpToHtmlElement() {
        //NOTE: here we assume that the root <html> element is always first in the open element stack, so
        //we perform this fast stack clean up.
        this.tmplCount = 0;
        this.shortenToLength(1);
    }
    _indexOfTagNames(tagNames, namespace) {
        for (let i = this.stackTop; i >= 0; i--) {
            if (tagNames.has(this.tagIDs[i]) && this.treeAdapter.getNamespaceURI(this.items[i]) === namespace) {
                return i;
            }
        }
        return -1;
    }
    clearBackTo(tagNames, targetNS) {
        const idx = this._indexOfTagNames(tagNames, targetNS);
        this.shortenToLength(idx + 1);
    }
    clearBackToTableContext() {
        this.clearBackTo(TABLE_CONTEXT, NS.HTML);
    }
    clearBackToTableBodyContext() {
        this.clearBackTo(TABLE_BODY_CONTEXT, NS.HTML);
    }
    clearBackToTableRowContext() {
        this.clearBackTo(TABLE_ROW_CONTEXT, NS.HTML);
    }
    remove(element) {
        const idx = this._indexOf(element);
        if (idx >= 0) {
            if (idx === this.stackTop) {
                this.pop();
            }
            else {
                this.items.splice(idx, 1);
                this.tagIDs.splice(idx, 1);
                this.stackTop--;
                this._updateCurrentElement();
                this.handler.onItemPop(element, false);
            }
        }
    }
    //Search
    tryPeekProperlyNestedBodyElement() {
        //Properly nested <body> element (should be second element in stack).
        return this.stackTop >= 1 && this.tagIDs[1] === TAG_ID.BODY ? this.items[1] : null;
    }
    contains(element) {
        return this._indexOf(element) > -1;
    }
    getCommonAncestor(element) {
        const elementIdx = this._indexOf(element) - 1;
        return elementIdx >= 0 ? this.items[elementIdx] : null;
    }
    isRootHtmlElementCurrent() {
        return this.stackTop === 0 && this.tagIDs[0] === TAG_ID.HTML;
    }
    //Element in scope
    hasInDynamicScope(tagName, htmlScope) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.tagIDs[i];
            switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
                case NS.HTML: {
                    if (tn === tagName)
                        return true;
                    if (htmlScope.has(tn))
                        return false;
                    break;
                }
                case NS.SVG: {
                    if (SCOPING_ELEMENTS_SVG.has(tn))
                        return false;
                    break;
                }
                case NS.MATHML: {
                    if (SCOPING_ELEMENTS_MATHML.has(tn))
                        return false;
                    break;
                }
            }
        }
        return true;
    }
    hasInScope(tagName) {
        return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML);
    }
    hasInListItemScope(tagName) {
        return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_LIST);
    }
    hasInButtonScope(tagName) {
        return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_BUTTON);
    }
    hasNumberedHeaderInScope() {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.tagIDs[i];
            switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
                case NS.HTML: {
                    if (NUMBERED_HEADERS.has(tn))
                        return true;
                    if (SCOPING_ELEMENTS_HTML.has(tn))
                        return false;
                    break;
                }
                case NS.SVG: {
                    if (SCOPING_ELEMENTS_SVG.has(tn))
                        return false;
                    break;
                }
                case NS.MATHML: {
                    if (SCOPING_ELEMENTS_MATHML.has(tn))
                        return false;
                    break;
                }
            }
        }
        return true;
    }
    hasInTableScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) {
                continue;
            }
            switch (this.tagIDs[i]) {
                case tagName: {
                    return true;
                }
                case TAG_ID.TABLE:
                case TAG_ID.HTML: {
                    return false;
                }
            }
        }
        return true;
    }
    hasTableBodyContextInTableScope() {
        for (let i = this.stackTop; i >= 0; i--) {
            if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) {
                continue;
            }
            switch (this.tagIDs[i]) {
                case TAG_ID.TBODY:
                case TAG_ID.THEAD:
                case TAG_ID.TFOOT: {
                    return true;
                }
                case TAG_ID.TABLE:
                case TAG_ID.HTML: {
                    return false;
                }
            }
        }
        return true;
    }
    hasInSelectScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) {
                continue;
            }
            switch (this.tagIDs[i]) {
                case tagName: {
                    return true;
                }
                case TAG_ID.OPTION:
                case TAG_ID.OPTGROUP: {
                    break;
                }
                default: {
                    return false;
                }
            }
        }
        return true;
    }
    //Implied end tags
    generateImpliedEndTags() {
        while (this.currentTagId !== undefined && IMPLICIT_END_TAG_REQUIRED.has(this.currentTagId)) {
            this.pop();
        }
    }
    generateImpliedEndTagsThoroughly() {
        while (this.currentTagId !== undefined && IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) {
            this.pop();
        }
    }
    generateImpliedEndTagsWithExclusion(exclusionId) {
        while (this.currentTagId !== undefined &&
            this.currentTagId !== exclusionId &&
            IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) {
            this.pop();
        }
    }
}

;// ./node_modules/parse5/dist/parser/formatting-element-list.js
//Const
const NOAH_ARK_CAPACITY = 3;
var EntryType;
(function (EntryType) {
    EntryType[EntryType["Marker"] = 0] = "Marker";
    EntryType[EntryType["Element"] = 1] = "Element";
})(EntryType || (EntryType = {}));
const MARKER = { type: EntryType.Marker };
//List of formatting elements
class FormattingElementList {
    constructor(treeAdapter) {
        this.treeAdapter = treeAdapter;
        this.entries = [];
        this.bookmark = null;
    }
    //Noah Ark's condition
    //OPTIMIZATION: at first we try to find possible candidates for exclusion using
    //lightweight heuristics without thorough attributes check.
    _getNoahArkConditionCandidates(newElement, neAttrs) {
        const candidates = [];
        const neAttrsLength = neAttrs.length;
        const neTagName = this.treeAdapter.getTagName(newElement);
        const neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);
        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            if (entry.type === EntryType.Marker) {
                break;
            }
            const { element } = entry;
            if (this.treeAdapter.getTagName(element) === neTagName &&
                this.treeAdapter.getNamespaceURI(element) === neNamespaceURI) {
                const elementAttrs = this.treeAdapter.getAttrList(element);
                if (elementAttrs.length === neAttrsLength) {
                    candidates.push({ idx: i, attrs: elementAttrs });
                }
            }
        }
        return candidates;
    }
    _ensureNoahArkCondition(newElement) {
        if (this.entries.length < NOAH_ARK_CAPACITY)
            return;
        const neAttrs = this.treeAdapter.getAttrList(newElement);
        const candidates = this._getNoahArkConditionCandidates(newElement, neAttrs);
        if (candidates.length < NOAH_ARK_CAPACITY)
            return;
        //NOTE: build attrs map for the new element, so we can perform fast lookups
        const neAttrsMap = new Map(neAttrs.map((neAttr) => [neAttr.name, neAttr.value]));
        let validCandidates = 0;
        //NOTE: remove bottommost candidates, until Noah's Ark condition will not be met
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            // We know that `candidate.attrs.length === neAttrs.length`
            if (candidate.attrs.every((cAttr) => neAttrsMap.get(cAttr.name) === cAttr.value)) {
                validCandidates += 1;
                if (validCandidates >= NOAH_ARK_CAPACITY) {
                    this.entries.splice(candidate.idx, 1);
                }
            }
        }
    }
    //Mutations
    insertMarker() {
        this.entries.unshift(MARKER);
    }
    pushElement(element, token) {
        this._ensureNoahArkCondition(element);
        this.entries.unshift({
            type: EntryType.Element,
            element,
            token,
        });
    }
    insertElementAfterBookmark(element, token) {
        const bookmarkIdx = this.entries.indexOf(this.bookmark);
        this.entries.splice(bookmarkIdx, 0, {
            type: EntryType.Element,
            element,
            token,
        });
    }
    removeEntry(entry) {
        const entryIndex = this.entries.indexOf(entry);
        if (entryIndex !== -1) {
            this.entries.splice(entryIndex, 1);
        }
    }
    /**
     * Clears the list of formatting elements up to the last marker.
     *
     * @see https://html.spec.whatwg.org/multipage/parsing.html#clear-the-list-of-active-formatting-elements-up-to-the-last-marker
     */
    clearToLastMarker() {
        const markerIdx = this.entries.indexOf(MARKER);
        if (markerIdx === -1) {
            this.entries.length = 0;
        }
        else {
            this.entries.splice(0, markerIdx + 1);
        }
    }
    //Search
    getElementEntryInScopeWithTagName(tagName) {
        const entry = this.entries.find((entry) => entry.type === EntryType.Marker || this.treeAdapter.getTagName(entry.element) === tagName);
        return entry && entry.type === EntryType.Element ? entry : null;
    }
    getElementEntry(element) {
        return this.entries.find((entry) => entry.type === EntryType.Element && entry.element === element);
    }
}

;// ./node_modules/parse5/dist/tree-adapters/default.js

const defaultTreeAdapter = {
    //Node construction
    createDocument() {
        return {
            nodeName: '#document',
            mode: DOCUMENT_MODE.NO_QUIRKS,
            childNodes: [],
        };
    },
    createDocumentFragment() {
        return {
            nodeName: '#document-fragment',
            childNodes: [],
        };
    },
    createElement(tagName, namespaceURI, attrs) {
        return {
            nodeName: tagName,
            tagName,
            attrs,
            namespaceURI,
            childNodes: [],
            parentNode: null,
        };
    },
    createCommentNode(data) {
        return {
            nodeName: '#comment',
            data,
            parentNode: null,
        };
    },
    createTextNode(value) {
        return {
            nodeName: '#text',
            value,
            parentNode: null,
        };
    },
    //Tree mutation
    appendChild(parentNode, newNode) {
        parentNode.childNodes.push(newNode);
        newNode.parentNode = parentNode;
    },
    insertBefore(parentNode, newNode, referenceNode) {
        const insertionIdx = parentNode.childNodes.indexOf(referenceNode);
        parentNode.childNodes.splice(insertionIdx, 0, newNode);
        newNode.parentNode = parentNode;
    },
    setTemplateContent(templateElement, contentElement) {
        templateElement.content = contentElement;
    },
    getTemplateContent(templateElement) {
        return templateElement.content;
    },
    setDocumentType(document, name, publicId, systemId) {
        const doctypeNode = document.childNodes.find((node) => node.nodeName === '#documentType');
        if (doctypeNode) {
            doctypeNode.name = name;
            doctypeNode.publicId = publicId;
            doctypeNode.systemId = systemId;
        }
        else {
            const node = {
                nodeName: '#documentType',
                name,
                publicId,
                systemId,
                parentNode: null,
            };
            defaultTreeAdapter.appendChild(document, node);
        }
    },
    setDocumentMode(document, mode) {
        document.mode = mode;
    },
    getDocumentMode(document) {
        return document.mode;
    },
    detachNode(node) {
        if (node.parentNode) {
            const idx = node.parentNode.childNodes.indexOf(node);
            node.parentNode.childNodes.splice(idx, 1);
            node.parentNode = null;
        }
    },
    insertText(parentNode, text) {
        if (parentNode.childNodes.length > 0) {
            const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];
            if (defaultTreeAdapter.isTextNode(prevNode)) {
                prevNode.value += text;
                return;
            }
        }
        defaultTreeAdapter.appendChild(parentNode, defaultTreeAdapter.createTextNode(text));
    },
    insertTextBefore(parentNode, text, referenceNode) {
        const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];
        if (prevNode && defaultTreeAdapter.isTextNode(prevNode)) {
            prevNode.value += text;
        }
        else {
            defaultTreeAdapter.insertBefore(parentNode, defaultTreeAdapter.createTextNode(text), referenceNode);
        }
    },
    adoptAttributes(recipient, attrs) {
        const recipientAttrsMap = new Set(recipient.attrs.map((attr) => attr.name));
        for (let j = 0; j < attrs.length; j++) {
            if (!recipientAttrsMap.has(attrs[j].name)) {
                recipient.attrs.push(attrs[j]);
            }
        }
    },
    //Tree traversing
    getFirstChild(node) {
        return node.childNodes[0];
    },
    getChildNodes(node) {
        return node.childNodes;
    },
    getParentNode(node) {
        return node.parentNode;
    },
    getAttrList(element) {
        return element.attrs;
    },
    //Node data
    getTagName(element) {
        return element.tagName;
    },
    getNamespaceURI(element) {
        return element.namespaceURI;
    },
    getTextNodeContent(textNode) {
        return textNode.value;
    },
    getCommentNodeContent(commentNode) {
        return commentNode.data;
    },
    getDocumentTypeNodeName(doctypeNode) {
        return doctypeNode.name;
    },
    getDocumentTypeNodePublicId(doctypeNode) {
        return doctypeNode.publicId;
    },
    getDocumentTypeNodeSystemId(doctypeNode) {
        return doctypeNode.systemId;
    },
    //Node types
    isTextNode(node) {
        return node.nodeName === '#text';
    },
    isCommentNode(node) {
        return node.nodeName === '#comment';
    },
    isDocumentTypeNode(node) {
        return node.nodeName === '#documentType';
    },
    isElementNode(node) {
        return Object.prototype.hasOwnProperty.call(node, 'tagName');
    },
    // Source code location
    setNodeSourceCodeLocation(node, location) {
        node.sourceCodeLocation = location;
    },
    getNodeSourceCodeLocation(node) {
        return node.sourceCodeLocation;
    },
    updateNodeSourceCodeLocation(node, endLocation) {
        node.sourceCodeLocation = { ...node.sourceCodeLocation, ...endLocation };
    },
};

;// ./node_modules/parse5/dist/common/doctype.js

//Const
const VALID_DOCTYPE_NAME = 'html';
const VALID_SYSTEM_ID = 'about:legacy-compat';
const QUIRKS_MODE_SYSTEM_ID = 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd';
const QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
    '+//silmaril//dtd html pro v0r11 19970101//',
    '-//as//dtd html 3.0 aswedit + extensions//',
    '-//advasoft ltd//dtd html 3.0 aswedit + extensions//',
    '-//ietf//dtd html 2.0 level 1//',
    '-//ietf//dtd html 2.0 level 2//',
    '-//ietf//dtd html 2.0 strict level 1//',
    '-//ietf//dtd html 2.0 strict level 2//',
    '-//ietf//dtd html 2.0 strict//',
    '-//ietf//dtd html 2.0//',
    '-//ietf//dtd html 2.1e//',
    '-//ietf//dtd html 3.0//',
    '-//ietf//dtd html 3.2 final//',
    '-//ietf//dtd html 3.2//',
    '-//ietf//dtd html 3//',
    '-//ietf//dtd html level 0//',
    '-//ietf//dtd html level 1//',
    '-//ietf//dtd html level 2//',
    '-//ietf//dtd html level 3//',
    '-//ietf//dtd html strict level 0//',
    '-//ietf//dtd html strict level 1//',
    '-//ietf//dtd html strict level 2//',
    '-//ietf//dtd html strict level 3//',
    '-//ietf//dtd html strict//',
    '-//ietf//dtd html//',
    '-//metrius//dtd metrius presentational//',
    '-//microsoft//dtd internet explorer 2.0 html strict//',
    '-//microsoft//dtd internet explorer 2.0 html//',
    '-//microsoft//dtd internet explorer 2.0 tables//',
    '-//microsoft//dtd internet explorer 3.0 html strict//',
    '-//microsoft//dtd internet explorer 3.0 html//',
    '-//microsoft//dtd internet explorer 3.0 tables//',
    '-//netscape comm. corp.//dtd html//',
    '-//netscape comm. corp.//dtd strict html//',
    "-//o'reilly and associates//dtd html 2.0//",
    "-//o'reilly and associates//dtd html extended 1.0//",
    "-//o'reilly and associates//dtd html extended relaxed 1.0//",
    '-//sq//dtd html 2.0 hotmetal + extensions//',
    '-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//',
    '-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//',
    '-//spyglass//dtd html 2.0 extended//',
    '-//sun microsystems corp.//dtd hotjava html//',
    '-//sun microsystems corp.//dtd hotjava strict html//',
    '-//w3c//dtd html 3 1995-03-24//',
    '-//w3c//dtd html 3.2 draft//',
    '-//w3c//dtd html 3.2 final//',
    '-//w3c//dtd html 3.2//',
    '-//w3c//dtd html 3.2s draft//',
    '-//w3c//dtd html 4.0 frameset//',
    '-//w3c//dtd html 4.0 transitional//',
    '-//w3c//dtd html experimental 19960712//',
    '-//w3c//dtd html experimental 970421//',
    '-//w3c//dtd w3 html//',
    '-//w3o//dtd w3 html 3.0//',
    '-//webtechs//dtd mozilla html 2.0//',
    '-//webtechs//dtd mozilla html//',
];
const QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
    ...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
    '-//w3c//dtd html 4.01 frameset//',
    '-//w3c//dtd html 4.01 transitional//',
];
const QUIRKS_MODE_PUBLIC_IDS = new Set([
    '-//w3o//dtd w3 html strict 3.0//en//',
    '-/w3c/dtd html 4.0 transitional/en',
    'html',
]);
const LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ['-//w3c//dtd xhtml 1.0 frameset//', '-//w3c//dtd xhtml 1.0 transitional//'];
const LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
    ...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
    '-//w3c//dtd html 4.01 frameset//',
    '-//w3c//dtd html 4.01 transitional//',
];
//Utils
function hasPrefix(publicId, prefixes) {
    return prefixes.some((prefix) => publicId.startsWith(prefix));
}
//API
function isConforming(token) {
    return (token.name === VALID_DOCTYPE_NAME &&
        token.publicId === null &&
        (token.systemId === null || token.systemId === VALID_SYSTEM_ID));
}
function getDocumentMode(token) {
    if (token.name !== VALID_DOCTYPE_NAME) {
        return DOCUMENT_MODE.QUIRKS;
    }
    const { systemId } = token;
    if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID) {
        return DOCUMENT_MODE.QUIRKS;
    }
    let { publicId } = token;
    if (publicId !== null) {
        publicId = publicId.toLowerCase();
        if (QUIRKS_MODE_PUBLIC_IDS.has(publicId)) {
            return DOCUMENT_MODE.QUIRKS;
        }
        let prefixes = systemId === null ? QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES : QUIRKS_MODE_PUBLIC_ID_PREFIXES;
        if (hasPrefix(publicId, prefixes)) {
            return DOCUMENT_MODE.QUIRKS;
        }
        prefixes =
            systemId === null ? LIMITED_QUIRKS_PUBLIC_ID_PREFIXES : LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;
        if (hasPrefix(publicId, prefixes)) {
            return DOCUMENT_MODE.LIMITED_QUIRKS;
        }
    }
    return DOCUMENT_MODE.NO_QUIRKS;
}

;// ./node_modules/parse5/dist/common/foreign-content.js

//MIME types
const MIME_TYPES = {
    TEXT_HTML: 'text/html',
    APPLICATION_XML: 'application/xhtml+xml',
};
//Attributes
const DEFINITION_URL_ATTR = 'definitionurl';
const ADJUSTED_DEFINITION_URL_ATTR = 'definitionURL';
const SVG_ATTRS_ADJUSTMENT_MAP = new Map([
    'attributeName',
    'attributeType',
    'baseFrequency',
    'baseProfile',
    'calcMode',
    'clipPathUnits',
    'diffuseConstant',
    'edgeMode',
    'filterUnits',
    'glyphRef',
    'gradientTransform',
    'gradientUnits',
    'kernelMatrix',
    'kernelUnitLength',
    'keyPoints',
    'keySplines',
    'keyTimes',
    'lengthAdjust',
    'limitingConeAngle',
    'markerHeight',
    'markerUnits',
    'markerWidth',
    'maskContentUnits',
    'maskUnits',
    'numOctaves',
    'pathLength',
    'patternContentUnits',
    'patternTransform',
    'patternUnits',
    'pointsAtX',
    'pointsAtY',
    'pointsAtZ',
    'preserveAlpha',
    'preserveAspectRatio',
    'primitiveUnits',
    'refX',
    'refY',
    'repeatCount',
    'repeatDur',
    'requiredExtensions',
    'requiredFeatures',
    'specularConstant',
    'specularExponent',
    'spreadMethod',
    'startOffset',
    'stdDeviation',
    'stitchTiles',
    'surfaceScale',
    'systemLanguage',
    'tableValues',
    'targetX',
    'targetY',
    'textLength',
    'viewBox',
    'viewTarget',
    'xChannelSelector',
    'yChannelSelector',
    'zoomAndPan',
].map((attr) => [attr.toLowerCase(), attr]));
const XML_ATTRS_ADJUSTMENT_MAP = new Map([
    ['xlink:actuate', { prefix: 'xlink', name: 'actuate', namespace: NS.XLINK }],
    ['xlink:arcrole', { prefix: 'xlink', name: 'arcrole', namespace: NS.XLINK }],
    ['xlink:href', { prefix: 'xlink', name: 'href', namespace: NS.XLINK }],
    ['xlink:role', { prefix: 'xlink', name: 'role', namespace: NS.XLINK }],
    ['xlink:show', { prefix: 'xlink', name: 'show', namespace: NS.XLINK }],
    ['xlink:title', { prefix: 'xlink', name: 'title', namespace: NS.XLINK }],
    ['xlink:type', { prefix: 'xlink', name: 'type', namespace: NS.XLINK }],
    ['xml:lang', { prefix: 'xml', name: 'lang', namespace: NS.XML }],
    ['xml:space', { prefix: 'xml', name: 'space', namespace: NS.XML }],
    ['xmlns', { prefix: '', name: 'xmlns', namespace: NS.XMLNS }],
    ['xmlns:xlink', { prefix: 'xmlns', name: 'xlink', namespace: NS.XMLNS }],
]);
//SVG tag names adjustment map
const SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map([
    'altGlyph',
    'altGlyphDef',
    'altGlyphItem',
    'animateColor',
    'animateMotion',
    'animateTransform',
    'clipPath',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotLight',
    'feTile',
    'feTurbulence',
    'foreignObject',
    'glyphRef',
    'linearGradient',
    'radialGradient',
    'textPath',
].map((tn) => [tn.toLowerCase(), tn]));
//Tags that causes exit from foreign content
const EXITS_FOREIGN_CONTENT = new Set([
    TAG_ID.B,
    TAG_ID.BIG,
    TAG_ID.BLOCKQUOTE,
    TAG_ID.BODY,
    TAG_ID.BR,
    TAG_ID.CENTER,
    TAG_ID.CODE,
    TAG_ID.DD,
    TAG_ID.DIV,
    TAG_ID.DL,
    TAG_ID.DT,
    TAG_ID.EM,
    TAG_ID.EMBED,
    TAG_ID.H1,
    TAG_ID.H2,
    TAG_ID.H3,
    TAG_ID.H4,
    TAG_ID.H5,
    TAG_ID.H6,
    TAG_ID.HEAD,
    TAG_ID.HR,
    TAG_ID.I,
    TAG_ID.IMG,
    TAG_ID.LI,
    TAG_ID.LISTING,
    TAG_ID.MENU,
    TAG_ID.META,
    TAG_ID.NOBR,
    TAG_ID.OL,
    TAG_ID.P,
    TAG_ID.PRE,
    TAG_ID.RUBY,
    TAG_ID.S,
    TAG_ID.SMALL,
    TAG_ID.SPAN,
    TAG_ID.STRONG,
    TAG_ID.STRIKE,
    TAG_ID.SUB,
    TAG_ID.SUP,
    TAG_ID.TABLE,
    TAG_ID.TT,
    TAG_ID.U,
    TAG_ID.UL,
    TAG_ID.VAR,
]);
//Check exit from foreign content
function causesExit(startTagToken) {
    const tn = startTagToken.tagID;
    const isFontWithAttrs = tn === TAG_ID.FONT &&
        startTagToken.attrs.some(({ name }) => name === ATTRS.COLOR || name === ATTRS.SIZE || name === ATTRS.FACE);
    return isFontWithAttrs || EXITS_FOREIGN_CONTENT.has(tn);
}
//Token adjustments
function adjustTokenMathMLAttrs(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        if (token.attrs[i].name === DEFINITION_URL_ATTR) {
            token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
            break;
        }
    }
}
function adjustTokenSVGAttrs(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        const adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
        if (adjustedAttrName != null) {
            token.attrs[i].name = adjustedAttrName;
        }
    }
}
function adjustTokenXMLAttrs(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        const adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
        if (adjustedAttrEntry) {
            token.attrs[i].prefix = adjustedAttrEntry.prefix;
            token.attrs[i].name = adjustedAttrEntry.name;
            token.attrs[i].namespace = adjustedAttrEntry.namespace;
        }
    }
}
function adjustTokenSVGTagName(token) {
    const adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP.get(token.tagName);
    if (adjustedTagName != null) {
        token.tagName = adjustedTagName;
        token.tagID = getTagID(token.tagName);
    }
}
//Integration points
function isMathMLTextIntegrationPoint(tn, ns) {
    return ns === NS.MATHML && (tn === TAG_ID.MI || tn === TAG_ID.MO || tn === TAG_ID.MN || tn === TAG_ID.MS || tn === TAG_ID.MTEXT);
}
function isHtmlIntegrationPoint(tn, ns, attrs) {
    if (ns === NS.MATHML && tn === TAG_ID.ANNOTATION_XML) {
        for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name === ATTRS.ENCODING) {
                const value = attrs[i].value.toLowerCase();
                return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
            }
        }
    }
    return ns === NS.SVG && (tn === TAG_ID.FOREIGN_OBJECT || tn === TAG_ID.DESC || tn === TAG_ID.TITLE);
}
function isIntegrationPoint(tn, ns, attrs, foreignNS) {
    return (((!foreignNS || foreignNS === NS.HTML) && isHtmlIntegrationPoint(tn, ns, attrs)) ||
        ((!foreignNS || foreignNS === NS.MATHML) && isMathMLTextIntegrationPoint(tn, ns)));
}

;// ./node_modules/parse5/dist/parser/index.js










//Misc constants
const HIDDEN_INPUT_TYPE = 'hidden';
//Adoption agency loops iteration count
const AA_OUTER_LOOP_ITER = 8;
const AA_INNER_LOOP_ITER = 3;
//Insertion modes
var InsertionMode;
(function (InsertionMode) {
    InsertionMode[InsertionMode["INITIAL"] = 0] = "INITIAL";
    InsertionMode[InsertionMode["BEFORE_HTML"] = 1] = "BEFORE_HTML";
    InsertionMode[InsertionMode["BEFORE_HEAD"] = 2] = "BEFORE_HEAD";
    InsertionMode[InsertionMode["IN_HEAD"] = 3] = "IN_HEAD";
    InsertionMode[InsertionMode["IN_HEAD_NO_SCRIPT"] = 4] = "IN_HEAD_NO_SCRIPT";
    InsertionMode[InsertionMode["AFTER_HEAD"] = 5] = "AFTER_HEAD";
    InsertionMode[InsertionMode["IN_BODY"] = 6] = "IN_BODY";
    InsertionMode[InsertionMode["TEXT"] = 7] = "TEXT";
    InsertionMode[InsertionMode["IN_TABLE"] = 8] = "IN_TABLE";
    InsertionMode[InsertionMode["IN_TABLE_TEXT"] = 9] = "IN_TABLE_TEXT";
    InsertionMode[InsertionMode["IN_CAPTION"] = 10] = "IN_CAPTION";
    InsertionMode[InsertionMode["IN_COLUMN_GROUP"] = 11] = "IN_COLUMN_GROUP";
    InsertionMode[InsertionMode["IN_TABLE_BODY"] = 12] = "IN_TABLE_BODY";
    InsertionMode[InsertionMode["IN_ROW"] = 13] = "IN_ROW";
    InsertionMode[InsertionMode["IN_CELL"] = 14] = "IN_CELL";
    InsertionMode[InsertionMode["IN_SELECT"] = 15] = "IN_SELECT";
    InsertionMode[InsertionMode["IN_SELECT_IN_TABLE"] = 16] = "IN_SELECT_IN_TABLE";
    InsertionMode[InsertionMode["IN_TEMPLATE"] = 17] = "IN_TEMPLATE";
    InsertionMode[InsertionMode["AFTER_BODY"] = 18] = "AFTER_BODY";
    InsertionMode[InsertionMode["IN_FRAMESET"] = 19] = "IN_FRAMESET";
    InsertionMode[InsertionMode["AFTER_FRAMESET"] = 20] = "AFTER_FRAMESET";
    InsertionMode[InsertionMode["AFTER_AFTER_BODY"] = 21] = "AFTER_AFTER_BODY";
    InsertionMode[InsertionMode["AFTER_AFTER_FRAMESET"] = 22] = "AFTER_AFTER_FRAMESET";
})(InsertionMode || (InsertionMode = {}));
const BASE_LOC = {
    startLine: -1,
    startCol: -1,
    startOffset: -1,
    endLine: -1,
    endCol: -1,
    endOffset: -1,
};
const TABLE_STRUCTURE_TAGS = new Set([TAG_ID.TABLE, TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TR]);
const defaultParserOptions = {
    scriptingEnabled: true,
    sourceCodeLocationInfo: false,
    treeAdapter: defaultTreeAdapter,
    onParseError: null,
};
//Parser
class Parser {
    constructor(options, document, 
    /** @internal */
    fragmentContext = null, 
    /** @internal */
    scriptHandler = null) {
        this.fragmentContext = fragmentContext;
        this.scriptHandler = scriptHandler;
        this.currentToken = null;
        this.stopped = false;
        /** @internal */
        this.insertionMode = InsertionMode.INITIAL;
        /** @internal */
        this.originalInsertionMode = InsertionMode.INITIAL;
        /** @internal */
        this.headElement = null;
        /** @internal */
        this.formElement = null;
        /** Indicates that the current node is not an element in the HTML namespace */
        this.currentNotInHTML = false;
        /**
         * The template insertion mode stack is maintained from the left.
         * Ie. the topmost element will always have index 0.
         *
         * @internal
         */
        this.tmplInsertionModeStack = [];
        /** @internal */
        this.pendingCharacterTokens = [];
        /** @internal */
        this.hasNonWhitespacePendingCharacterToken = false;
        /** @internal */
        this.framesetOk = true;
        /** @internal */
        this.skipNextNewLine = false;
        /** @internal */
        this.fosterParentingEnabled = false;
        this.options = {
            ...defaultParserOptions,
            ...options,
        };
        this.treeAdapter = this.options.treeAdapter;
        this.onParseError = this.options.onParseError;
        // Always enable location info if we report parse errors.
        if (this.onParseError) {
            this.options.sourceCodeLocationInfo = true;
        }
        this.document = document !== null && document !== void 0 ? document : this.treeAdapter.createDocument();
        this.tokenizer = new Tokenizer(this.options, this);
        this.activeFormattingElements = new FormattingElementList(this.treeAdapter);
        this.fragmentContextID = fragmentContext ? getTagID(this.treeAdapter.getTagName(fragmentContext)) : TAG_ID.UNKNOWN;
        this._setContextModes(fragmentContext !== null && fragmentContext !== void 0 ? fragmentContext : this.document, this.fragmentContextID);
        this.openElements = new OpenElementStack(this.document, this.treeAdapter, this);
    }
    // API
    static parse(html, options) {
        const parser = new this(options);
        parser.tokenizer.write(html, true);
        return parser.document;
    }
    static getFragmentParser(fragmentContext, options) {
        const opts = {
            ...defaultParserOptions,
            ...options,
        };
        //NOTE: use a <template> element as the fragment context if no context element was provided,
        //so we will parse in a "forgiving" manner
        fragmentContext !== null && fragmentContext !== void 0 ? fragmentContext : (fragmentContext = opts.treeAdapter.createElement(TAG_NAMES.TEMPLATE, NS.HTML, []));
        //NOTE: create a fake element which will be used as the `document` for fragment parsing.
        //This is important for jsdom, where a new `document` cannot be created. This led to
        //fragment parsing messing with the main `document`.
        const documentMock = opts.treeAdapter.createElement('documentmock', NS.HTML, []);
        const parser = new this(opts, documentMock, fragmentContext);
        if (parser.fragmentContextID === TAG_ID.TEMPLATE) {
            parser.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
        }
        parser._initTokenizerForFragmentParsing();
        parser._insertFakeRootElement();
        parser._resetInsertionMode();
        parser._findFormInFragmentContext();
        return parser;
    }
    getFragment() {
        const rootElement = this.treeAdapter.getFirstChild(this.document);
        const fragment = this.treeAdapter.createDocumentFragment();
        this._adoptNodes(rootElement, fragment);
        return fragment;
    }
    //Errors
    /** @internal */
    _err(token, code, beforeToken) {
        var _a;
        if (!this.onParseError)
            return;
        const loc = (_a = token.location) !== null && _a !== void 0 ? _a : BASE_LOC;
        const err = {
            code,
            startLine: loc.startLine,
            startCol: loc.startCol,
            startOffset: loc.startOffset,
            endLine: beforeToken ? loc.startLine : loc.endLine,
            endCol: beforeToken ? loc.startCol : loc.endCol,
            endOffset: beforeToken ? loc.startOffset : loc.endOffset,
        };
        this.onParseError(err);
    }
    //Stack events
    /** @internal */
    onItemPush(node, tid, isTop) {
        var _a, _b;
        (_b = (_a = this.treeAdapter).onItemPush) === null || _b === void 0 ? void 0 : _b.call(_a, node);
        if (isTop && this.openElements.stackTop > 0)
            this._setContextModes(node, tid);
    }
    /** @internal */
    onItemPop(node, isTop) {
        var _a, _b;
        if (this.options.sourceCodeLocationInfo) {
            this._setEndLocation(node, this.currentToken);
        }
        (_b = (_a = this.treeAdapter).onItemPop) === null || _b === void 0 ? void 0 : _b.call(_a, node, this.openElements.current);
        if (isTop) {
            let current;
            let currentTagId;
            if (this.openElements.stackTop === 0 && this.fragmentContext) {
                current = this.fragmentContext;
                currentTagId = this.fragmentContextID;
            }
            else {
                ({ current, currentTagId } = this.openElements);
            }
            this._setContextModes(current, currentTagId);
        }
    }
    _setContextModes(current, tid) {
        const isHTML = current === this.document || (current && this.treeAdapter.getNamespaceURI(current) === NS.HTML);
        this.currentNotInHTML = !isHTML;
        this.tokenizer.inForeignNode =
            !isHTML && current !== undefined && tid !== undefined && !this._isIntegrationPoint(tid, current);
    }
    /** @protected */
    _switchToTextParsing(currentToken, nextTokenizerState) {
        this._insertElement(currentToken, NS.HTML);
        this.tokenizer.state = nextTokenizerState;
        this.originalInsertionMode = this.insertionMode;
        this.insertionMode = InsertionMode.TEXT;
    }
    switchToPlaintextParsing() {
        this.insertionMode = InsertionMode.TEXT;
        this.originalInsertionMode = InsertionMode.IN_BODY;
        this.tokenizer.state = TokenizerMode.PLAINTEXT;
    }
    //Fragment parsing
    /** @protected */
    _getAdjustedCurrentElement() {
        return this.openElements.stackTop === 0 && this.fragmentContext
            ? this.fragmentContext
            : this.openElements.current;
    }
    /** @protected */
    _findFormInFragmentContext() {
        let node = this.fragmentContext;
        while (node) {
            if (this.treeAdapter.getTagName(node) === TAG_NAMES.FORM) {
                this.formElement = node;
                break;
            }
            node = this.treeAdapter.getParentNode(node);
        }
    }
    _initTokenizerForFragmentParsing() {
        if (!this.fragmentContext || this.treeAdapter.getNamespaceURI(this.fragmentContext) !== NS.HTML) {
            return;
        }
        switch (this.fragmentContextID) {
            case TAG_ID.TITLE:
            case TAG_ID.TEXTAREA: {
                this.tokenizer.state = TokenizerMode.RCDATA;
                break;
            }
            case TAG_ID.STYLE:
            case TAG_ID.XMP:
            case TAG_ID.IFRAME:
            case TAG_ID.NOEMBED:
            case TAG_ID.NOFRAMES:
            case TAG_ID.NOSCRIPT: {
                this.tokenizer.state = TokenizerMode.RAWTEXT;
                break;
            }
            case TAG_ID.SCRIPT: {
                this.tokenizer.state = TokenizerMode.SCRIPT_DATA;
                break;
            }
            case TAG_ID.PLAINTEXT: {
                this.tokenizer.state = TokenizerMode.PLAINTEXT;
                break;
            }
            default:
            // Do nothing
        }
    }
    //Tree mutation
    /** @protected */
    _setDocumentType(token) {
        const name = token.name || '';
        const publicId = token.publicId || '';
        const systemId = token.systemId || '';
        this.treeAdapter.setDocumentType(this.document, name, publicId, systemId);
        if (token.location) {
            const documentChildren = this.treeAdapter.getChildNodes(this.document);
            const docTypeNode = documentChildren.find((node) => this.treeAdapter.isDocumentTypeNode(node));
            if (docTypeNode) {
                this.treeAdapter.setNodeSourceCodeLocation(docTypeNode, token.location);
            }
        }
    }
    /** @protected */
    _attachElementToTree(element, location) {
        if (this.options.sourceCodeLocationInfo) {
            const loc = location && {
                ...location,
                startTag: location,
            };
            this.treeAdapter.setNodeSourceCodeLocation(element, loc);
        }
        if (this._shouldFosterParentOnInsertion()) {
            this._fosterParentElement(element);
        }
        else {
            const parent = this.openElements.currentTmplContentOrNode;
            this.treeAdapter.appendChild(parent !== null && parent !== void 0 ? parent : this.document, element);
        }
    }
    /**
     * For self-closing tags. Add an element to the tree, but skip adding it
     * to the stack.
     */
    /** @protected */
    _appendElement(token, namespaceURI) {
        const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
        this._attachElementToTree(element, token.location);
    }
    /** @protected */
    _insertElement(token, namespaceURI) {
        const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
        this._attachElementToTree(element, token.location);
        this.openElements.push(element, token.tagID);
    }
    /** @protected */
    _insertFakeElement(tagName, tagID) {
        const element = this.treeAdapter.createElement(tagName, NS.HTML, []);
        this._attachElementToTree(element, null);
        this.openElements.push(element, tagID);
    }
    /** @protected */
    _insertTemplate(token) {
        const tmpl = this.treeAdapter.createElement(token.tagName, NS.HTML, token.attrs);
        const content = this.treeAdapter.createDocumentFragment();
        this.treeAdapter.setTemplateContent(tmpl, content);
        this._attachElementToTree(tmpl, token.location);
        this.openElements.push(tmpl, token.tagID);
        if (this.options.sourceCodeLocationInfo)
            this.treeAdapter.setNodeSourceCodeLocation(content, null);
    }
    /** @protected */
    _insertFakeRootElement() {
        const element = this.treeAdapter.createElement(TAG_NAMES.HTML, NS.HTML, []);
        if (this.options.sourceCodeLocationInfo)
            this.treeAdapter.setNodeSourceCodeLocation(element, null);
        this.treeAdapter.appendChild(this.openElements.current, element);
        this.openElements.push(element, TAG_ID.HTML);
    }
    /** @protected */
    _appendCommentNode(token, parent) {
        const commentNode = this.treeAdapter.createCommentNode(token.data);
        this.treeAdapter.appendChild(parent, commentNode);
        if (this.options.sourceCodeLocationInfo) {
            this.treeAdapter.setNodeSourceCodeLocation(commentNode, token.location);
        }
    }
    /** @protected */
    _insertCharacters(token) {
        let parent;
        let beforeElement;
        if (this._shouldFosterParentOnInsertion()) {
            ({ parent, beforeElement } = this._findFosterParentingLocation());
            if (beforeElement) {
                this.treeAdapter.insertTextBefore(parent, token.chars, beforeElement);
            }
            else {
                this.treeAdapter.insertText(parent, token.chars);
            }
        }
        else {
            parent = this.openElements.currentTmplContentOrNode;
            this.treeAdapter.insertText(parent, token.chars);
        }
        if (!token.location)
            return;
        const siblings = this.treeAdapter.getChildNodes(parent);
        const textNodeIdx = beforeElement ? siblings.lastIndexOf(beforeElement) : siblings.length;
        const textNode = siblings[textNodeIdx - 1];
        //NOTE: if we have a location assigned by another token, then just update the end position
        const tnLoc = this.treeAdapter.getNodeSourceCodeLocation(textNode);
        if (tnLoc) {
            const { endLine, endCol, endOffset } = token.location;
            this.treeAdapter.updateNodeSourceCodeLocation(textNode, { endLine, endCol, endOffset });
        }
        else if (this.options.sourceCodeLocationInfo) {
            this.treeAdapter.setNodeSourceCodeLocation(textNode, token.location);
        }
    }
    /** @protected */
    _adoptNodes(donor, recipient) {
        for (let child = this.treeAdapter.getFirstChild(donor); child; child = this.treeAdapter.getFirstChild(donor)) {
            this.treeAdapter.detachNode(child);
            this.treeAdapter.appendChild(recipient, child);
        }
    }
    /** @protected */
    _setEndLocation(element, closingToken) {
        if (this.treeAdapter.getNodeSourceCodeLocation(element) && closingToken.location) {
            const ctLoc = closingToken.location;
            const tn = this.treeAdapter.getTagName(element);
            const endLoc = 
            // NOTE: For cases like <p> <p> </p> - First 'p' closes without a closing
            // tag and for cases like <td> <p> </td> - 'p' closes without a closing tag.
            closingToken.type === TokenType.END_TAG && tn === closingToken.tagName
                ? {
                    endTag: { ...ctLoc },
                    endLine: ctLoc.endLine,
                    endCol: ctLoc.endCol,
                    endOffset: ctLoc.endOffset,
                }
                : {
                    endLine: ctLoc.startLine,
                    endCol: ctLoc.startCol,
                    endOffset: ctLoc.startOffset,
                };
            this.treeAdapter.updateNodeSourceCodeLocation(element, endLoc);
        }
    }
    //Token processing
    shouldProcessStartTagTokenInForeignContent(token) {
        // Check that neither current === document, or ns === NS.HTML
        if (!this.currentNotInHTML)
            return false;
        let current;
        let currentTagId;
        if (this.openElements.stackTop === 0 && this.fragmentContext) {
            current = this.fragmentContext;
            currentTagId = this.fragmentContextID;
        }
        else {
            ({ current, currentTagId } = this.openElements);
        }
        if (token.tagID === TAG_ID.SVG &&
            this.treeAdapter.getTagName(current) === TAG_NAMES.ANNOTATION_XML &&
            this.treeAdapter.getNamespaceURI(current) === NS.MATHML) {
            return false;
        }
        return (
        // Check that `current` is not an integration point for HTML or MathML elements.
        this.tokenizer.inForeignNode ||
            // If it _is_ an integration point, then we might have to check that it is not an HTML
            // integration point.
            ((token.tagID === TAG_ID.MGLYPH || token.tagID === TAG_ID.MALIGNMARK) &&
                currentTagId !== undefined &&
                !this._isIntegrationPoint(currentTagId, current, NS.HTML)));
    }
    /** @protected */
    _processToken(token) {
        switch (token.type) {
            case TokenType.CHARACTER: {
                this.onCharacter(token);
                break;
            }
            case TokenType.NULL_CHARACTER: {
                this.onNullCharacter(token);
                break;
            }
            case TokenType.COMMENT: {
                this.onComment(token);
                break;
            }
            case TokenType.DOCTYPE: {
                this.onDoctype(token);
                break;
            }
            case TokenType.START_TAG: {
                this._processStartTag(token);
                break;
            }
            case TokenType.END_TAG: {
                this.onEndTag(token);
                break;
            }
            case TokenType.EOF: {
                this.onEof(token);
                break;
            }
            case TokenType.WHITESPACE_CHARACTER: {
                this.onWhitespaceCharacter(token);
                break;
            }
        }
    }
    //Integration points
    /** @protected */
    _isIntegrationPoint(tid, element, foreignNS) {
        const ns = this.treeAdapter.getNamespaceURI(element);
        const attrs = this.treeAdapter.getAttrList(element);
        return isIntegrationPoint(tid, ns, attrs, foreignNS);
    }
    //Active formatting elements reconstruction
    /** @protected */
    _reconstructActiveFormattingElements() {
        const listLength = this.activeFormattingElements.entries.length;
        if (listLength) {
            const endIndex = this.activeFormattingElements.entries.findIndex((entry) => entry.type === EntryType.Marker || this.openElements.contains(entry.element));
            const unopenIdx = endIndex === -1 ? listLength - 1 : endIndex - 1;
            for (let i = unopenIdx; i >= 0; i--) {
                const entry = this.activeFormattingElements.entries[i];
                this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
                entry.element = this.openElements.current;
            }
        }
    }
    //Close elements
    /** @protected */
    _closeTableCell() {
        this.openElements.generateImpliedEndTags();
        this.openElements.popUntilTableCellPopped();
        this.activeFormattingElements.clearToLastMarker();
        this.insertionMode = InsertionMode.IN_ROW;
    }
    /** @protected */
    _closePElement() {
        this.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.P);
        this.openElements.popUntilTagNamePopped(TAG_ID.P);
    }
    //Insertion modes
    /** @protected */
    _resetInsertionMode() {
        for (let i = this.openElements.stackTop; i >= 0; i--) {
            //Insertion mode reset map
            switch (i === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[i]) {
                case TAG_ID.TR: {
                    this.insertionMode = InsertionMode.IN_ROW;
                    return;
                }
                case TAG_ID.TBODY:
                case TAG_ID.THEAD:
                case TAG_ID.TFOOT: {
                    this.insertionMode = InsertionMode.IN_TABLE_BODY;
                    return;
                }
                case TAG_ID.CAPTION: {
                    this.insertionMode = InsertionMode.IN_CAPTION;
                    return;
                }
                case TAG_ID.COLGROUP: {
                    this.insertionMode = InsertionMode.IN_COLUMN_GROUP;
                    return;
                }
                case TAG_ID.TABLE: {
                    this.insertionMode = InsertionMode.IN_TABLE;
                    return;
                }
                case TAG_ID.BODY: {
                    this.insertionMode = InsertionMode.IN_BODY;
                    return;
                }
                case TAG_ID.FRAMESET: {
                    this.insertionMode = InsertionMode.IN_FRAMESET;
                    return;
                }
                case TAG_ID.SELECT: {
                    this._resetInsertionModeForSelect(i);
                    return;
                }
                case TAG_ID.TEMPLATE: {
                    this.insertionMode = this.tmplInsertionModeStack[0];
                    return;
                }
                case TAG_ID.HTML: {
                    this.insertionMode = this.headElement ? InsertionMode.AFTER_HEAD : InsertionMode.BEFORE_HEAD;
                    return;
                }
                case TAG_ID.TD:
                case TAG_ID.TH: {
                    if (i > 0) {
                        this.insertionMode = InsertionMode.IN_CELL;
                        return;
                    }
                    break;
                }
                case TAG_ID.HEAD: {
                    if (i > 0) {
                        this.insertionMode = InsertionMode.IN_HEAD;
                        return;
                    }
                    break;
                }
            }
        }
        this.insertionMode = InsertionMode.IN_BODY;
    }
    /** @protected */
    _resetInsertionModeForSelect(selectIdx) {
        if (selectIdx > 0) {
            for (let i = selectIdx - 1; i > 0; i--) {
                const tn = this.openElements.tagIDs[i];
                if (tn === TAG_ID.TEMPLATE) {
                    break;
                }
                else if (tn === TAG_ID.TABLE) {
                    this.insertionMode = InsertionMode.IN_SELECT_IN_TABLE;
                    return;
                }
            }
        }
        this.insertionMode = InsertionMode.IN_SELECT;
    }
    //Foster parenting
    /** @protected */
    _isElementCausesFosterParenting(tn) {
        return TABLE_STRUCTURE_TAGS.has(tn);
    }
    /** @protected */
    _shouldFosterParentOnInsertion() {
        return (this.fosterParentingEnabled &&
            this.openElements.currentTagId !== undefined &&
            this._isElementCausesFosterParenting(this.openElements.currentTagId));
    }
    /** @protected */
    _findFosterParentingLocation() {
        for (let i = this.openElements.stackTop; i >= 0; i--) {
            const openElement = this.openElements.items[i];
            switch (this.openElements.tagIDs[i]) {
                case TAG_ID.TEMPLATE: {
                    if (this.treeAdapter.getNamespaceURI(openElement) === NS.HTML) {
                        return { parent: this.treeAdapter.getTemplateContent(openElement), beforeElement: null };
                    }
                    break;
                }
                case TAG_ID.TABLE: {
                    const parent = this.treeAdapter.getParentNode(openElement);
                    if (parent) {
                        return { parent, beforeElement: openElement };
                    }
                    return { parent: this.openElements.items[i - 1], beforeElement: null };
                }
                default:
                // Do nothing
            }
        }
        return { parent: this.openElements.items[0], beforeElement: null };
    }
    /** @protected */
    _fosterParentElement(element) {
        const location = this._findFosterParentingLocation();
        if (location.beforeElement) {
            this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
        }
        else {
            this.treeAdapter.appendChild(location.parent, element);
        }
    }
    //Special elements
    /** @protected */
    _isSpecialElement(element, id) {
        const ns = this.treeAdapter.getNamespaceURI(element);
        return SPECIAL_ELEMENTS[ns].has(id);
    }
    /** @internal */
    onCharacter(token) {
        this.skipNextNewLine = false;
        if (this.tokenizer.inForeignNode) {
            characterInForeignContent(this, token);
            return;
        }
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                tokenInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HTML: {
                tokenBeforeHtml(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD: {
                tokenBeforeHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD: {
                tokenInHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD_NO_SCRIPT: {
                tokenInHeadNoScript(this, token);
                break;
            }
            case InsertionMode.AFTER_HEAD: {
                tokenAfterHead(this, token);
                break;
            }
            case InsertionMode.IN_BODY:
            case InsertionMode.IN_CAPTION:
            case InsertionMode.IN_CELL:
            case InsertionMode.IN_TEMPLATE: {
                characterInBody(this, token);
                break;
            }
            case InsertionMode.TEXT:
            case InsertionMode.IN_SELECT:
            case InsertionMode.IN_SELECT_IN_TABLE: {
                this._insertCharacters(token);
                break;
            }
            case InsertionMode.IN_TABLE:
            case InsertionMode.IN_TABLE_BODY:
            case InsertionMode.IN_ROW: {
                characterInTable(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                characterInTableText(this, token);
                break;
            }
            case InsertionMode.IN_COLUMN_GROUP: {
                tokenInColumnGroup(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY: {
                tokenAfterBody(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_BODY: {
                tokenAfterAfterBody(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onNullCharacter(token) {
        this.skipNextNewLine = false;
        if (this.tokenizer.inForeignNode) {
            nullCharacterInForeignContent(this, token);
            return;
        }
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                tokenInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HTML: {
                tokenBeforeHtml(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD: {
                tokenBeforeHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD: {
                tokenInHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD_NO_SCRIPT: {
                tokenInHeadNoScript(this, token);
                break;
            }
            case InsertionMode.AFTER_HEAD: {
                tokenAfterHead(this, token);
                break;
            }
            case InsertionMode.TEXT: {
                this._insertCharacters(token);
                break;
            }
            case InsertionMode.IN_TABLE:
            case InsertionMode.IN_TABLE_BODY:
            case InsertionMode.IN_ROW: {
                characterInTable(this, token);
                break;
            }
            case InsertionMode.IN_COLUMN_GROUP: {
                tokenInColumnGroup(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY: {
                tokenAfterBody(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_BODY: {
                tokenAfterAfterBody(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onComment(token) {
        this.skipNextNewLine = false;
        if (this.currentNotInHTML) {
            appendComment(this, token);
            return;
        }
        switch (this.insertionMode) {
            case InsertionMode.INITIAL:
            case InsertionMode.BEFORE_HTML:
            case InsertionMode.BEFORE_HEAD:
            case InsertionMode.IN_HEAD:
            case InsertionMode.IN_HEAD_NO_SCRIPT:
            case InsertionMode.AFTER_HEAD:
            case InsertionMode.IN_BODY:
            case InsertionMode.IN_TABLE:
            case InsertionMode.IN_CAPTION:
            case InsertionMode.IN_COLUMN_GROUP:
            case InsertionMode.IN_TABLE_BODY:
            case InsertionMode.IN_ROW:
            case InsertionMode.IN_CELL:
            case InsertionMode.IN_SELECT:
            case InsertionMode.IN_SELECT_IN_TABLE:
            case InsertionMode.IN_TEMPLATE:
            case InsertionMode.IN_FRAMESET:
            case InsertionMode.AFTER_FRAMESET: {
                appendComment(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                tokenInTableText(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY: {
                appendCommentToRootHtmlElement(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_BODY:
            case InsertionMode.AFTER_AFTER_FRAMESET: {
                appendCommentToDocument(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onDoctype(token) {
        this.skipNextNewLine = false;
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                doctypeInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD:
            case InsertionMode.IN_HEAD:
            case InsertionMode.IN_HEAD_NO_SCRIPT:
            case InsertionMode.AFTER_HEAD: {
                this._err(token, ERR.misplacedDoctype);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                tokenInTableText(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onStartTag(token) {
        this.skipNextNewLine = false;
        this.currentToken = token;
        this._processStartTag(token);
        if (token.selfClosing && !token.ackSelfClosing) {
            this._err(token, ERR.nonVoidHtmlElementStartTagWithTrailingSolidus);
        }
    }
    /**
     * Processes a given start tag.
     *
     * `onStartTag` checks if a self-closing tag was recognized. When a token
     * is moved inbetween multiple insertion modes, this check for self-closing
     * could lead to false positives. To avoid this, `_processStartTag` is used
     * for nested calls.
     *
     * @param token The token to process.
     * @protected
     */
    _processStartTag(token) {
        if (this.shouldProcessStartTagTokenInForeignContent(token)) {
            startTagInForeignContent(this, token);
        }
        else {
            this._startTagOutsideForeignContent(token);
        }
    }
    /** @protected */
    _startTagOutsideForeignContent(token) {
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                tokenInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HTML: {
                startTagBeforeHtml(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD: {
                startTagBeforeHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD: {
                startTagInHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD_NO_SCRIPT: {
                startTagInHeadNoScript(this, token);
                break;
            }
            case InsertionMode.AFTER_HEAD: {
                startTagAfterHead(this, token);
                break;
            }
            case InsertionMode.IN_BODY: {
                startTagInBody(this, token);
                break;
            }
            case InsertionMode.IN_TABLE: {
                startTagInTable(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                tokenInTableText(this, token);
                break;
            }
            case InsertionMode.IN_CAPTION: {
                startTagInCaption(this, token);
                break;
            }
            case InsertionMode.IN_COLUMN_GROUP: {
                startTagInColumnGroup(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_BODY: {
                startTagInTableBody(this, token);
                break;
            }
            case InsertionMode.IN_ROW: {
                startTagInRow(this, token);
                break;
            }
            case InsertionMode.IN_CELL: {
                startTagInCell(this, token);
                break;
            }
            case InsertionMode.IN_SELECT: {
                startTagInSelect(this, token);
                break;
            }
            case InsertionMode.IN_SELECT_IN_TABLE: {
                startTagInSelectInTable(this, token);
                break;
            }
            case InsertionMode.IN_TEMPLATE: {
                startTagInTemplate(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY: {
                startTagAfterBody(this, token);
                break;
            }
            case InsertionMode.IN_FRAMESET: {
                startTagInFrameset(this, token);
                break;
            }
            case InsertionMode.AFTER_FRAMESET: {
                startTagAfterFrameset(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_BODY: {
                startTagAfterAfterBody(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_FRAMESET: {
                startTagAfterAfterFrameset(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onEndTag(token) {
        this.skipNextNewLine = false;
        this.currentToken = token;
        if (this.currentNotInHTML) {
            endTagInForeignContent(this, token);
        }
        else {
            this._endTagOutsideForeignContent(token);
        }
    }
    /** @protected */
    _endTagOutsideForeignContent(token) {
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                tokenInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HTML: {
                endTagBeforeHtml(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD: {
                endTagBeforeHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD: {
                endTagInHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD_NO_SCRIPT: {
                endTagInHeadNoScript(this, token);
                break;
            }
            case InsertionMode.AFTER_HEAD: {
                endTagAfterHead(this, token);
                break;
            }
            case InsertionMode.IN_BODY: {
                endTagInBody(this, token);
                break;
            }
            case InsertionMode.TEXT: {
                endTagInText(this, token);
                break;
            }
            case InsertionMode.IN_TABLE: {
                endTagInTable(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                tokenInTableText(this, token);
                break;
            }
            case InsertionMode.IN_CAPTION: {
                endTagInCaption(this, token);
                break;
            }
            case InsertionMode.IN_COLUMN_GROUP: {
                endTagInColumnGroup(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_BODY: {
                endTagInTableBody(this, token);
                break;
            }
            case InsertionMode.IN_ROW: {
                endTagInRow(this, token);
                break;
            }
            case InsertionMode.IN_CELL: {
                endTagInCell(this, token);
                break;
            }
            case InsertionMode.IN_SELECT: {
                endTagInSelect(this, token);
                break;
            }
            case InsertionMode.IN_SELECT_IN_TABLE: {
                endTagInSelectInTable(this, token);
                break;
            }
            case InsertionMode.IN_TEMPLATE: {
                endTagInTemplate(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY: {
                endTagAfterBody(this, token);
                break;
            }
            case InsertionMode.IN_FRAMESET: {
                endTagInFrameset(this, token);
                break;
            }
            case InsertionMode.AFTER_FRAMESET: {
                endTagAfterFrameset(this, token);
                break;
            }
            case InsertionMode.AFTER_AFTER_BODY: {
                tokenAfterAfterBody(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onEof(token) {
        switch (this.insertionMode) {
            case InsertionMode.INITIAL: {
                tokenInInitialMode(this, token);
                break;
            }
            case InsertionMode.BEFORE_HTML: {
                tokenBeforeHtml(this, token);
                break;
            }
            case InsertionMode.BEFORE_HEAD: {
                tokenBeforeHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD: {
                tokenInHead(this, token);
                break;
            }
            case InsertionMode.IN_HEAD_NO_SCRIPT: {
                tokenInHeadNoScript(this, token);
                break;
            }
            case InsertionMode.AFTER_HEAD: {
                tokenAfterHead(this, token);
                break;
            }
            case InsertionMode.IN_BODY:
            case InsertionMode.IN_TABLE:
            case InsertionMode.IN_CAPTION:
            case InsertionMode.IN_COLUMN_GROUP:
            case InsertionMode.IN_TABLE_BODY:
            case InsertionMode.IN_ROW:
            case InsertionMode.IN_CELL:
            case InsertionMode.IN_SELECT:
            case InsertionMode.IN_SELECT_IN_TABLE: {
                eofInBody(this, token);
                break;
            }
            case InsertionMode.TEXT: {
                eofInText(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                tokenInTableText(this, token);
                break;
            }
            case InsertionMode.IN_TEMPLATE: {
                eofInTemplate(this, token);
                break;
            }
            case InsertionMode.AFTER_BODY:
            case InsertionMode.IN_FRAMESET:
            case InsertionMode.AFTER_FRAMESET:
            case InsertionMode.AFTER_AFTER_BODY:
            case InsertionMode.AFTER_AFTER_FRAMESET: {
                stopParsing(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
    /** @internal */
    onWhitespaceCharacter(token) {
        if (this.skipNextNewLine) {
            this.skipNextNewLine = false;
            if (token.chars.charCodeAt(0) === CODE_POINTS.LINE_FEED) {
                if (token.chars.length === 1) {
                    return;
                }
                token.chars = token.chars.substr(1);
            }
        }
        if (this.tokenizer.inForeignNode) {
            this._insertCharacters(token);
            return;
        }
        switch (this.insertionMode) {
            case InsertionMode.IN_HEAD:
            case InsertionMode.IN_HEAD_NO_SCRIPT:
            case InsertionMode.AFTER_HEAD:
            case InsertionMode.TEXT:
            case InsertionMode.IN_COLUMN_GROUP:
            case InsertionMode.IN_SELECT:
            case InsertionMode.IN_SELECT_IN_TABLE:
            case InsertionMode.IN_FRAMESET:
            case InsertionMode.AFTER_FRAMESET: {
                this._insertCharacters(token);
                break;
            }
            case InsertionMode.IN_BODY:
            case InsertionMode.IN_CAPTION:
            case InsertionMode.IN_CELL:
            case InsertionMode.IN_TEMPLATE:
            case InsertionMode.AFTER_BODY:
            case InsertionMode.AFTER_AFTER_BODY:
            case InsertionMode.AFTER_AFTER_FRAMESET: {
                whitespaceCharacterInBody(this, token);
                break;
            }
            case InsertionMode.IN_TABLE:
            case InsertionMode.IN_TABLE_BODY:
            case InsertionMode.IN_ROW: {
                characterInTable(this, token);
                break;
            }
            case InsertionMode.IN_TABLE_TEXT: {
                whitespaceCharacterInTableText(this, token);
                break;
            }
            default:
            // Do nothing
        }
    }
}
//Adoption agency algorithm
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html#adoptionAgency)
//------------------------------------------------------------------
//Steps 5-8 of the algorithm
function aaObtainFormattingElementEntry(p, token) {
    let formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(token.tagName);
    if (formattingElementEntry) {
        if (!p.openElements.contains(formattingElementEntry.element)) {
            p.activeFormattingElements.removeEntry(formattingElementEntry);
            formattingElementEntry = null;
        }
        else if (!p.openElements.hasInScope(token.tagID)) {
            formattingElementEntry = null;
        }
    }
    else {
        genericEndTagInBody(p, token);
    }
    return formattingElementEntry;
}
//Steps 9 and 10 of the algorithm
function aaObtainFurthestBlock(p, formattingElementEntry) {
    let furthestBlock = null;
    let idx = p.openElements.stackTop;
    for (; idx >= 0; idx--) {
        const element = p.openElements.items[idx];
        if (element === formattingElementEntry.element) {
            break;
        }
        if (p._isSpecialElement(element, p.openElements.tagIDs[idx])) {
            furthestBlock = element;
        }
    }
    if (!furthestBlock) {
        p.openElements.shortenToLength(Math.max(idx, 0));
        p.activeFormattingElements.removeEntry(formattingElementEntry);
    }
    return furthestBlock;
}
//Step 13 of the algorithm
function aaInnerLoop(p, furthestBlock, formattingElement) {
    let lastElement = furthestBlock;
    let nextElement = p.openElements.getCommonAncestor(furthestBlock);
    for (let i = 0, element = nextElement; element !== formattingElement; i++, element = nextElement) {
        //NOTE: store the next element for the next loop iteration (it may be deleted from the stack by step 9.5)
        nextElement = p.openElements.getCommonAncestor(element);
        const elementEntry = p.activeFormattingElements.getElementEntry(element);
        const counterOverflow = elementEntry && i >= AA_INNER_LOOP_ITER;
        const shouldRemoveFromOpenElements = !elementEntry || counterOverflow;
        if (shouldRemoveFromOpenElements) {
            if (counterOverflow) {
                p.activeFormattingElements.removeEntry(elementEntry);
            }
            p.openElements.remove(element);
        }
        else {
            element = aaRecreateElementFromEntry(p, elementEntry);
            if (lastElement === furthestBlock) {
                p.activeFormattingElements.bookmark = elementEntry;
            }
            p.treeAdapter.detachNode(lastElement);
            p.treeAdapter.appendChild(element, lastElement);
            lastElement = element;
        }
    }
    return lastElement;
}
//Step 13.7 of the algorithm
function aaRecreateElementFromEntry(p, elementEntry) {
    const ns = p.treeAdapter.getNamespaceURI(elementEntry.element);
    const newElement = p.treeAdapter.createElement(elementEntry.token.tagName, ns, elementEntry.token.attrs);
    p.openElements.replace(elementEntry.element, newElement);
    elementEntry.element = newElement;
    return newElement;
}
//Step 14 of the algorithm
function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
    const tn = p.treeAdapter.getTagName(commonAncestor);
    const tid = getTagID(tn);
    if (p._isElementCausesFosterParenting(tid)) {
        p._fosterParentElement(lastElement);
    }
    else {
        const ns = p.treeAdapter.getNamespaceURI(commonAncestor);
        if (tid === TAG_ID.TEMPLATE && ns === NS.HTML) {
            commonAncestor = p.treeAdapter.getTemplateContent(commonAncestor);
        }
        p.treeAdapter.appendChild(commonAncestor, lastElement);
    }
}
//Steps 15-19 of the algorithm
function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
    const ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element);
    const { token } = formattingElementEntry;
    const newElement = p.treeAdapter.createElement(token.tagName, ns, token.attrs);
    p._adoptNodes(furthestBlock, newElement);
    p.treeAdapter.appendChild(furthestBlock, newElement);
    p.activeFormattingElements.insertElementAfterBookmark(newElement, token);
    p.activeFormattingElements.removeEntry(formattingElementEntry);
    p.openElements.remove(formattingElementEntry.element);
    p.openElements.insertAfter(furthestBlock, newElement, token.tagID);
}
//Algorithm entry point
function callAdoptionAgency(p, token) {
    for (let i = 0; i < AA_OUTER_LOOP_ITER; i++) {
        const formattingElementEntry = aaObtainFormattingElementEntry(p, token);
        if (!formattingElementEntry) {
            break;
        }
        const furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);
        if (!furthestBlock) {
            break;
        }
        p.activeFormattingElements.bookmark = formattingElementEntry;
        const lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element);
        const commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);
        p.treeAdapter.detachNode(lastElement);
        if (commonAncestor)
            aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
        aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
    }
}
//Generic token handlers
//------------------------------------------------------------------
function appendComment(p, token) {
    p._appendCommentNode(token, p.openElements.currentTmplContentOrNode);
}
function appendCommentToRootHtmlElement(p, token) {
    p._appendCommentNode(token, p.openElements.items[0]);
}
function appendCommentToDocument(p, token) {
    p._appendCommentNode(token, p.document);
}
function stopParsing(p, token) {
    p.stopped = true;
    // NOTE: Set end locations for elements that remain on the open element stack.
    if (token.location) {
        // NOTE: If we are not in a fragment, `html` and `body` will stay on the stack.
        // This is a problem, as we might overwrite their end position here.
        const target = p.fragmentContext ? 0 : 2;
        for (let i = p.openElements.stackTop; i >= target; i--) {
            p._setEndLocation(p.openElements.items[i], token);
        }
        // Handle `html` and `body`
        if (!p.fragmentContext && p.openElements.stackTop >= 0) {
            const htmlElement = p.openElements.items[0];
            const htmlLocation = p.treeAdapter.getNodeSourceCodeLocation(htmlElement);
            if (htmlLocation && !htmlLocation.endTag) {
                p._setEndLocation(htmlElement, token);
                if (p.openElements.stackTop >= 1) {
                    const bodyElement = p.openElements.items[1];
                    const bodyLocation = p.treeAdapter.getNodeSourceCodeLocation(bodyElement);
                    if (bodyLocation && !bodyLocation.endTag) {
                        p._setEndLocation(bodyElement, token);
                    }
                }
            }
        }
    }
}
// The "initial" insertion mode
//------------------------------------------------------------------
function doctypeInInitialMode(p, token) {
    p._setDocumentType(token);
    const mode = token.forceQuirks ? DOCUMENT_MODE.QUIRKS : getDocumentMode(token);
    if (!isConforming(token)) {
        p._err(token, ERR.nonConformingDoctype);
    }
    p.treeAdapter.setDocumentMode(p.document, mode);
    p.insertionMode = InsertionMode.BEFORE_HTML;
}
function tokenInInitialMode(p, token) {
    p._err(token, ERR.missingDoctype, true);
    p.treeAdapter.setDocumentMode(p.document, DOCUMENT_MODE.QUIRKS);
    p.insertionMode = InsertionMode.BEFORE_HTML;
    p._processToken(token);
}
// The "before html" insertion mode
//------------------------------------------------------------------
function startTagBeforeHtml(p, token) {
    if (token.tagID === TAG_ID.HTML) {
        p._insertElement(token, NS.HTML);
        p.insertionMode = InsertionMode.BEFORE_HEAD;
    }
    else {
        tokenBeforeHtml(p, token);
    }
}
function endTagBeforeHtml(p, token) {
    const tn = token.tagID;
    if (tn === TAG_ID.HTML || tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.BR) {
        tokenBeforeHtml(p, token);
    }
}
function tokenBeforeHtml(p, token) {
    p._insertFakeRootElement();
    p.insertionMode = InsertionMode.BEFORE_HEAD;
    p._processToken(token);
}
// The "before head" insertion mode
//------------------------------------------------------------------
function startTagBeforeHead(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.HEAD: {
            p._insertElement(token, NS.HTML);
            p.headElement = p.openElements.current;
            p.insertionMode = InsertionMode.IN_HEAD;
            break;
        }
        default: {
            tokenBeforeHead(p, token);
        }
    }
}
function endTagBeforeHead(p, token) {
    const tn = token.tagID;
    if (tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.HTML || tn === TAG_ID.BR) {
        tokenBeforeHead(p, token);
    }
    else {
        p._err(token, ERR.endTagWithoutMatchingOpenElement);
    }
}
function tokenBeforeHead(p, token) {
    p._insertFakeElement(TAG_NAMES.HEAD, TAG_ID.HEAD);
    p.headElement = p.openElements.current;
    p.insertionMode = InsertionMode.IN_HEAD;
    p._processToken(token);
}
// The "in head" insertion mode
//------------------------------------------------------------------
function startTagInHead(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.BASE:
        case TAG_ID.BASEFONT:
        case TAG_ID.BGSOUND:
        case TAG_ID.LINK:
        case TAG_ID.META: {
            p._appendElement(token, NS.HTML);
            token.ackSelfClosing = true;
            break;
        }
        case TAG_ID.TITLE: {
            p._switchToTextParsing(token, TokenizerMode.RCDATA);
            break;
        }
        case TAG_ID.NOSCRIPT: {
            if (p.options.scriptingEnabled) {
                p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
            }
            else {
                p._insertElement(token, NS.HTML);
                p.insertionMode = InsertionMode.IN_HEAD_NO_SCRIPT;
            }
            break;
        }
        case TAG_ID.NOFRAMES:
        case TAG_ID.STYLE: {
            p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
            break;
        }
        case TAG_ID.SCRIPT: {
            p._switchToTextParsing(token, TokenizerMode.SCRIPT_DATA);
            break;
        }
        case TAG_ID.TEMPLATE: {
            p._insertTemplate(token);
            p.activeFormattingElements.insertMarker();
            p.framesetOk = false;
            p.insertionMode = InsertionMode.IN_TEMPLATE;
            p.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
            break;
        }
        case TAG_ID.HEAD: {
            p._err(token, ERR.misplacedStartTagForHeadElement);
            break;
        }
        default: {
            tokenInHead(p, token);
        }
    }
}
function endTagInHead(p, token) {
    switch (token.tagID) {
        case TAG_ID.HEAD: {
            p.openElements.pop();
            p.insertionMode = InsertionMode.AFTER_HEAD;
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.BR:
        case TAG_ID.HTML: {
            tokenInHead(p, token);
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        default: {
            p._err(token, ERR.endTagWithoutMatchingOpenElement);
        }
    }
}
function templateEndTagInHead(p, token) {
    if (p.openElements.tmplCount > 0) {
        p.openElements.generateImpliedEndTagsThoroughly();
        if (p.openElements.currentTagId !== TAG_ID.TEMPLATE) {
            p._err(token, ERR.closingOfElementWithOpenChildElements);
        }
        p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
        p.activeFormattingElements.clearToLastMarker();
        p.tmplInsertionModeStack.shift();
        p._resetInsertionMode();
    }
    else {
        p._err(token, ERR.endTagWithoutMatchingOpenElement);
    }
}
function tokenInHead(p, token) {
    p.openElements.pop();
    p.insertionMode = InsertionMode.AFTER_HEAD;
    p._processToken(token);
}
// The "in head no script" insertion mode
//------------------------------------------------------------------
function startTagInHeadNoScript(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.BASEFONT:
        case TAG_ID.BGSOUND:
        case TAG_ID.HEAD:
        case TAG_ID.LINK:
        case TAG_ID.META:
        case TAG_ID.NOFRAMES:
        case TAG_ID.STYLE: {
            startTagInHead(p, token);
            break;
        }
        case TAG_ID.NOSCRIPT: {
            p._err(token, ERR.nestedNoscriptInHead);
            break;
        }
        default: {
            tokenInHeadNoScript(p, token);
        }
    }
}
function endTagInHeadNoScript(p, token) {
    switch (token.tagID) {
        case TAG_ID.NOSCRIPT: {
            p.openElements.pop();
            p.insertionMode = InsertionMode.IN_HEAD;
            break;
        }
        case TAG_ID.BR: {
            tokenInHeadNoScript(p, token);
            break;
        }
        default: {
            p._err(token, ERR.endTagWithoutMatchingOpenElement);
        }
    }
}
function tokenInHeadNoScript(p, token) {
    const errCode = token.type === TokenType.EOF ? ERR.openElementsLeftAfterEof : ERR.disallowedContentInNoscriptInHead;
    p._err(token, errCode);
    p.openElements.pop();
    p.insertionMode = InsertionMode.IN_HEAD;
    p._processToken(token);
}
// The "after head" insertion mode
//------------------------------------------------------------------
function startTagAfterHead(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.BODY: {
            p._insertElement(token, NS.HTML);
            p.framesetOk = false;
            p.insertionMode = InsertionMode.IN_BODY;
            break;
        }
        case TAG_ID.FRAMESET: {
            p._insertElement(token, NS.HTML);
            p.insertionMode = InsertionMode.IN_FRAMESET;
            break;
        }
        case TAG_ID.BASE:
        case TAG_ID.BASEFONT:
        case TAG_ID.BGSOUND:
        case TAG_ID.LINK:
        case TAG_ID.META:
        case TAG_ID.NOFRAMES:
        case TAG_ID.SCRIPT:
        case TAG_ID.STYLE:
        case TAG_ID.TEMPLATE:
        case TAG_ID.TITLE: {
            p._err(token, ERR.abandonedHeadElementChild);
            p.openElements.push(p.headElement, TAG_ID.HEAD);
            startTagInHead(p, token);
            p.openElements.remove(p.headElement);
            break;
        }
        case TAG_ID.HEAD: {
            p._err(token, ERR.misplacedStartTagForHeadElement);
            break;
        }
        default: {
            tokenAfterHead(p, token);
        }
    }
}
function endTagAfterHead(p, token) {
    switch (token.tagID) {
        case TAG_ID.BODY:
        case TAG_ID.HTML:
        case TAG_ID.BR: {
            tokenAfterHead(p, token);
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        default: {
            p._err(token, ERR.endTagWithoutMatchingOpenElement);
        }
    }
}
function tokenAfterHead(p, token) {
    p._insertFakeElement(TAG_NAMES.BODY, TAG_ID.BODY);
    p.insertionMode = InsertionMode.IN_BODY;
    modeInBody(p, token);
}
// The "in body" insertion mode
//------------------------------------------------------------------
function modeInBody(p, token) {
    switch (token.type) {
        case TokenType.CHARACTER: {
            characterInBody(p, token);
            break;
        }
        case TokenType.WHITESPACE_CHARACTER: {
            whitespaceCharacterInBody(p, token);
            break;
        }
        case TokenType.COMMENT: {
            appendComment(p, token);
            break;
        }
        case TokenType.START_TAG: {
            startTagInBody(p, token);
            break;
        }
        case TokenType.END_TAG: {
            endTagInBody(p, token);
            break;
        }
        case TokenType.EOF: {
            eofInBody(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
function whitespaceCharacterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
}
function characterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
    p.framesetOk = false;
}
function htmlStartTagInBody(p, token) {
    if (p.openElements.tmplCount === 0) {
        p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
    }
}
function bodyStartTagInBody(p, token) {
    const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
    if (bodyElement && p.openElements.tmplCount === 0) {
        p.framesetOk = false;
        p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
    }
}
function framesetStartTagInBody(p, token) {
    const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
    if (p.framesetOk && bodyElement) {
        p.treeAdapter.detachNode(bodyElement);
        p.openElements.popAllUpToHtmlElement();
        p._insertElement(token, NS.HTML);
        p.insertionMode = InsertionMode.IN_FRAMESET;
    }
}
function addressStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._insertElement(token, NS.HTML);
}
function numberedHeaderStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    if (p.openElements.currentTagId !== undefined && NUMBERED_HEADERS.has(p.openElements.currentTagId)) {
        p.openElements.pop();
    }
    p._insertElement(token, NS.HTML);
}
function preStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of pre blocks are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.framesetOk = false;
}
function formStartTagInBody(p, token) {
    const inTemplate = p.openElements.tmplCount > 0;
    if (!p.formElement || inTemplate) {
        if (p.openElements.hasInButtonScope(TAG_ID.P)) {
            p._closePElement();
        }
        p._insertElement(token, NS.HTML);
        if (!inTemplate) {
            p.formElement = p.openElements.current;
        }
    }
}
function listItemStartTagInBody(p, token) {
    p.framesetOk = false;
    const tn = token.tagID;
    for (let i = p.openElements.stackTop; i >= 0; i--) {
        const elementId = p.openElements.tagIDs[i];
        if ((tn === TAG_ID.LI && elementId === TAG_ID.LI) ||
            ((tn === TAG_ID.DD || tn === TAG_ID.DT) && (elementId === TAG_ID.DD || elementId === TAG_ID.DT))) {
            p.openElements.generateImpliedEndTagsWithExclusion(elementId);
            p.openElements.popUntilTagNamePopped(elementId);
            break;
        }
        if (elementId !== TAG_ID.ADDRESS &&
            elementId !== TAG_ID.DIV &&
            elementId !== TAG_ID.P &&
            p._isSpecialElement(p.openElements.items[i], elementId)) {
            break;
        }
    }
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._insertElement(token, NS.HTML);
}
function plaintextStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._insertElement(token, NS.HTML);
    p.tokenizer.state = TokenizerMode.PLAINTEXT;
}
function buttonStartTagInBody(p, token) {
    if (p.openElements.hasInScope(TAG_ID.BUTTON)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(TAG_ID.BUTTON);
    }
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
}
function aStartTagInBody(p, token) {
    const activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(TAG_NAMES.A);
    if (activeElementEntry) {
        callAdoptionAgency(p, token);
        p.openElements.remove(activeElementEntry.element);
        p.activeFormattingElements.removeEntry(activeElementEntry);
    }
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function bStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function nobrStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    if (p.openElements.hasInScope(TAG_ID.NOBR)) {
        callAdoptionAgency(p, token);
        p._reconstructActiveFormattingElements();
    }
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}
function appletStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.insertMarker();
    p.framesetOk = false;
}
function tableStartTagInBody(p, token) {
    if (p.treeAdapter.getDocumentMode(p.document) !== DOCUMENT_MODE.QUIRKS && p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
    p.insertionMode = InsertionMode.IN_TABLE;
}
function areaStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
    token.ackSelfClosing = true;
}
function isHiddenInput(token) {
    const inputType = getTokenAttr(token, ATTRS.TYPE);
    return inputType != null && inputType.toLowerCase() === HIDDEN_INPUT_TYPE;
}
function inputStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);
    if (!isHiddenInput(token)) {
        p.framesetOk = false;
    }
    token.ackSelfClosing = true;
}
function paramStartTagInBody(p, token) {
    p._appendElement(token, NS.HTML);
    token.ackSelfClosing = true;
}
function hrStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
    token.ackSelfClosing = true;
}
function imageStartTagInBody(p, token) {
    token.tagName = TAG_NAMES.IMG;
    token.tagID = TAG_ID.IMG;
    areaStartTagInBody(p, token);
}
function textareaStartTagInBody(p, token) {
    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of textarea elements are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.tokenizer.state = TokenizerMode.RCDATA;
    p.originalInsertionMode = p.insertionMode;
    p.framesetOk = false;
    p.insertionMode = InsertionMode.TEXT;
}
function xmpStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._closePElement();
    }
    p._reconstructActiveFormattingElements();
    p.framesetOk = false;
    p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
function iframeStartTagInBody(p, token) {
    p.framesetOk = false;
    p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
//NOTE: here we assume that we always act as a user agent with enabled plugins/frames, so we parse
//<noembed>/<noframes> as rawtext.
function rawTextStartTagInBody(p, token) {
    p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
}
function selectStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
    p.insertionMode =
        p.insertionMode === InsertionMode.IN_TABLE ||
            p.insertionMode === InsertionMode.IN_CAPTION ||
            p.insertionMode === InsertionMode.IN_TABLE_BODY ||
            p.insertionMode === InsertionMode.IN_ROW ||
            p.insertionMode === InsertionMode.IN_CELL
            ? InsertionMode.IN_SELECT_IN_TABLE
            : InsertionMode.IN_SELECT;
}
function optgroupStartTagInBody(p, token) {
    if (p.openElements.currentTagId === TAG_ID.OPTION) {
        p.openElements.pop();
    }
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}
function rbStartTagInBody(p, token) {
    if (p.openElements.hasInScope(TAG_ID.RUBY)) {
        p.openElements.generateImpliedEndTags();
    }
    p._insertElement(token, NS.HTML);
}
function rtStartTagInBody(p, token) {
    if (p.openElements.hasInScope(TAG_ID.RUBY)) {
        p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.RTC);
    }
    p._insertElement(token, NS.HTML);
}
function mathStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    adjustTokenMathMLAttrs(token);
    adjustTokenXMLAttrs(token);
    if (token.selfClosing) {
        p._appendElement(token, NS.MATHML);
    }
    else {
        p._insertElement(token, NS.MATHML);
    }
    token.ackSelfClosing = true;
}
function svgStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    adjustTokenSVGAttrs(token);
    adjustTokenXMLAttrs(token);
    if (token.selfClosing) {
        p._appendElement(token, NS.SVG);
    }
    else {
        p._insertElement(token, NS.SVG);
    }
    token.ackSelfClosing = true;
}
function genericStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}
function startTagInBody(p, token) {
    switch (token.tagID) {
        case TAG_ID.I:
        case TAG_ID.S:
        case TAG_ID.B:
        case TAG_ID.U:
        case TAG_ID.EM:
        case TAG_ID.TT:
        case TAG_ID.BIG:
        case TAG_ID.CODE:
        case TAG_ID.FONT:
        case TAG_ID.SMALL:
        case TAG_ID.STRIKE:
        case TAG_ID.STRONG: {
            bStartTagInBody(p, token);
            break;
        }
        case TAG_ID.A: {
            aStartTagInBody(p, token);
            break;
        }
        case TAG_ID.H1:
        case TAG_ID.H2:
        case TAG_ID.H3:
        case TAG_ID.H4:
        case TAG_ID.H5:
        case TAG_ID.H6: {
            numberedHeaderStartTagInBody(p, token);
            break;
        }
        case TAG_ID.P:
        case TAG_ID.DL:
        case TAG_ID.OL:
        case TAG_ID.UL:
        case TAG_ID.DIV:
        case TAG_ID.DIR:
        case TAG_ID.NAV:
        case TAG_ID.MAIN:
        case TAG_ID.MENU:
        case TAG_ID.ASIDE:
        case TAG_ID.CENTER:
        case TAG_ID.FIGURE:
        case TAG_ID.FOOTER:
        case TAG_ID.HEADER:
        case TAG_ID.HGROUP:
        case TAG_ID.DIALOG:
        case TAG_ID.DETAILS:
        case TAG_ID.ADDRESS:
        case TAG_ID.ARTICLE:
        case TAG_ID.SEARCH:
        case TAG_ID.SECTION:
        case TAG_ID.SUMMARY:
        case TAG_ID.FIELDSET:
        case TAG_ID.BLOCKQUOTE:
        case TAG_ID.FIGCAPTION: {
            addressStartTagInBody(p, token);
            break;
        }
        case TAG_ID.LI:
        case TAG_ID.DD:
        case TAG_ID.DT: {
            listItemStartTagInBody(p, token);
            break;
        }
        case TAG_ID.BR:
        case TAG_ID.IMG:
        case TAG_ID.WBR:
        case TAG_ID.AREA:
        case TAG_ID.EMBED:
        case TAG_ID.KEYGEN: {
            areaStartTagInBody(p, token);
            break;
        }
        case TAG_ID.HR: {
            hrStartTagInBody(p, token);
            break;
        }
        case TAG_ID.RB:
        case TAG_ID.RTC: {
            rbStartTagInBody(p, token);
            break;
        }
        case TAG_ID.RT:
        case TAG_ID.RP: {
            rtStartTagInBody(p, token);
            break;
        }
        case TAG_ID.PRE:
        case TAG_ID.LISTING: {
            preStartTagInBody(p, token);
            break;
        }
        case TAG_ID.XMP: {
            xmpStartTagInBody(p, token);
            break;
        }
        case TAG_ID.SVG: {
            svgStartTagInBody(p, token);
            break;
        }
        case TAG_ID.HTML: {
            htmlStartTagInBody(p, token);
            break;
        }
        case TAG_ID.BASE:
        case TAG_ID.LINK:
        case TAG_ID.META:
        case TAG_ID.STYLE:
        case TAG_ID.TITLE:
        case TAG_ID.SCRIPT:
        case TAG_ID.BGSOUND:
        case TAG_ID.BASEFONT:
        case TAG_ID.TEMPLATE: {
            startTagInHead(p, token);
            break;
        }
        case TAG_ID.BODY: {
            bodyStartTagInBody(p, token);
            break;
        }
        case TAG_ID.FORM: {
            formStartTagInBody(p, token);
            break;
        }
        case TAG_ID.NOBR: {
            nobrStartTagInBody(p, token);
            break;
        }
        case TAG_ID.MATH: {
            mathStartTagInBody(p, token);
            break;
        }
        case TAG_ID.TABLE: {
            tableStartTagInBody(p, token);
            break;
        }
        case TAG_ID.INPUT: {
            inputStartTagInBody(p, token);
            break;
        }
        case TAG_ID.PARAM:
        case TAG_ID.TRACK:
        case TAG_ID.SOURCE: {
            paramStartTagInBody(p, token);
            break;
        }
        case TAG_ID.IMAGE: {
            imageStartTagInBody(p, token);
            break;
        }
        case TAG_ID.BUTTON: {
            buttonStartTagInBody(p, token);
            break;
        }
        case TAG_ID.APPLET:
        case TAG_ID.OBJECT:
        case TAG_ID.MARQUEE: {
            appletStartTagInBody(p, token);
            break;
        }
        case TAG_ID.IFRAME: {
            iframeStartTagInBody(p, token);
            break;
        }
        case TAG_ID.SELECT: {
            selectStartTagInBody(p, token);
            break;
        }
        case TAG_ID.OPTION:
        case TAG_ID.OPTGROUP: {
            optgroupStartTagInBody(p, token);
            break;
        }
        case TAG_ID.NOEMBED:
        case TAG_ID.NOFRAMES: {
            rawTextStartTagInBody(p, token);
            break;
        }
        case TAG_ID.FRAMESET: {
            framesetStartTagInBody(p, token);
            break;
        }
        case TAG_ID.TEXTAREA: {
            textareaStartTagInBody(p, token);
            break;
        }
        case TAG_ID.NOSCRIPT: {
            if (p.options.scriptingEnabled) {
                rawTextStartTagInBody(p, token);
            }
            else {
                genericStartTagInBody(p, token);
            }
            break;
        }
        case TAG_ID.PLAINTEXT: {
            plaintextStartTagInBody(p, token);
            break;
        }
        case TAG_ID.COL:
        case TAG_ID.TH:
        case TAG_ID.TD:
        case TAG_ID.TR:
        case TAG_ID.HEAD:
        case TAG_ID.FRAME:
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD:
        case TAG_ID.CAPTION:
        case TAG_ID.COLGROUP: {
            // Ignore token
            break;
        }
        default: {
            genericStartTagInBody(p, token);
        }
    }
}
function bodyEndTagInBody(p, token) {
    if (p.openElements.hasInScope(TAG_ID.BODY)) {
        p.insertionMode = InsertionMode.AFTER_BODY;
        //NOTE: <body> is never popped from the stack, so we need to updated
        //the end location explicitly.
        if (p.options.sourceCodeLocationInfo) {
            const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
            if (bodyElement) {
                p._setEndLocation(bodyElement, token);
            }
        }
    }
}
function htmlEndTagInBody(p, token) {
    if (p.openElements.hasInScope(TAG_ID.BODY)) {
        p.insertionMode = InsertionMode.AFTER_BODY;
        endTagAfterBody(p, token);
    }
}
function addressEndTagInBody(p, token) {
    const tn = token.tagID;
    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
    }
}
function formEndTagInBody(p) {
    const inTemplate = p.openElements.tmplCount > 0;
    const { formElement } = p;
    if (!inTemplate) {
        p.formElement = null;
    }
    if ((formElement || inTemplate) && p.openElements.hasInScope(TAG_ID.FORM)) {
        p.openElements.generateImpliedEndTags();
        if (inTemplate) {
            p.openElements.popUntilTagNamePopped(TAG_ID.FORM);
        }
        else if (formElement) {
            p.openElements.remove(formElement);
        }
    }
}
function pEndTagInBody(p) {
    if (!p.openElements.hasInButtonScope(TAG_ID.P)) {
        p._insertFakeElement(TAG_NAMES.P, TAG_ID.P);
    }
    p._closePElement();
}
function liEndTagInBody(p) {
    if (p.openElements.hasInListItemScope(TAG_ID.LI)) {
        p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.LI);
        p.openElements.popUntilTagNamePopped(TAG_ID.LI);
    }
}
function ddEndTagInBody(p, token) {
    const tn = token.tagID;
    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTagsWithExclusion(tn);
        p.openElements.popUntilTagNamePopped(tn);
    }
}
function numberedHeaderEndTagInBody(p) {
    if (p.openElements.hasNumberedHeaderInScope()) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilNumberedHeaderPopped();
    }
}
function appletEndTagInBody(p, token) {
    const tn = token.tagID;
    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
        p.activeFormattingElements.clearToLastMarker();
    }
}
function brEndTagInBody(p) {
    p._reconstructActiveFormattingElements();
    p._insertFakeElement(TAG_NAMES.BR, TAG_ID.BR);
    p.openElements.pop();
    p.framesetOk = false;
}
function genericEndTagInBody(p, token) {
    const tn = token.tagName;
    const tid = token.tagID;
    for (let i = p.openElements.stackTop; i > 0; i--) {
        const element = p.openElements.items[i];
        const elementId = p.openElements.tagIDs[i];
        // Compare the tag name here, as the tag might not be a known tag with an ID.
        if (tid === elementId && (tid !== TAG_ID.UNKNOWN || p.treeAdapter.getTagName(element) === tn)) {
            p.openElements.generateImpliedEndTagsWithExclusion(tid);
            if (p.openElements.stackTop >= i)
                p.openElements.shortenToLength(i);
            break;
        }
        if (p._isSpecialElement(element, elementId)) {
            break;
        }
    }
}
function endTagInBody(p, token) {
    switch (token.tagID) {
        case TAG_ID.A:
        case TAG_ID.B:
        case TAG_ID.I:
        case TAG_ID.S:
        case TAG_ID.U:
        case TAG_ID.EM:
        case TAG_ID.TT:
        case TAG_ID.BIG:
        case TAG_ID.CODE:
        case TAG_ID.FONT:
        case TAG_ID.NOBR:
        case TAG_ID.SMALL:
        case TAG_ID.STRIKE:
        case TAG_ID.STRONG: {
            callAdoptionAgency(p, token);
            break;
        }
        case TAG_ID.P: {
            pEndTagInBody(p);
            break;
        }
        case TAG_ID.DL:
        case TAG_ID.UL:
        case TAG_ID.OL:
        case TAG_ID.DIR:
        case TAG_ID.DIV:
        case TAG_ID.NAV:
        case TAG_ID.PRE:
        case TAG_ID.MAIN:
        case TAG_ID.MENU:
        case TAG_ID.ASIDE:
        case TAG_ID.BUTTON:
        case TAG_ID.CENTER:
        case TAG_ID.FIGURE:
        case TAG_ID.FOOTER:
        case TAG_ID.HEADER:
        case TAG_ID.HGROUP:
        case TAG_ID.DIALOG:
        case TAG_ID.ADDRESS:
        case TAG_ID.ARTICLE:
        case TAG_ID.DETAILS:
        case TAG_ID.SEARCH:
        case TAG_ID.SECTION:
        case TAG_ID.SUMMARY:
        case TAG_ID.LISTING:
        case TAG_ID.FIELDSET:
        case TAG_ID.BLOCKQUOTE:
        case TAG_ID.FIGCAPTION: {
            addressEndTagInBody(p, token);
            break;
        }
        case TAG_ID.LI: {
            liEndTagInBody(p);
            break;
        }
        case TAG_ID.DD:
        case TAG_ID.DT: {
            ddEndTagInBody(p, token);
            break;
        }
        case TAG_ID.H1:
        case TAG_ID.H2:
        case TAG_ID.H3:
        case TAG_ID.H4:
        case TAG_ID.H5:
        case TAG_ID.H6: {
            numberedHeaderEndTagInBody(p);
            break;
        }
        case TAG_ID.BR: {
            brEndTagInBody(p);
            break;
        }
        case TAG_ID.BODY: {
            bodyEndTagInBody(p, token);
            break;
        }
        case TAG_ID.HTML: {
            htmlEndTagInBody(p, token);
            break;
        }
        case TAG_ID.FORM: {
            formEndTagInBody(p);
            break;
        }
        case TAG_ID.APPLET:
        case TAG_ID.OBJECT:
        case TAG_ID.MARQUEE: {
            appletEndTagInBody(p, token);
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        default: {
            genericEndTagInBody(p, token);
        }
    }
}
function eofInBody(p, token) {
    if (p.tmplInsertionModeStack.length > 0) {
        eofInTemplate(p, token);
    }
    else {
        stopParsing(p, token);
    }
}
// The "text" insertion mode
//------------------------------------------------------------------
function endTagInText(p, token) {
    var _a;
    if (token.tagID === TAG_ID.SCRIPT) {
        (_a = p.scriptHandler) === null || _a === void 0 ? void 0 : _a.call(p, p.openElements.current);
    }
    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
}
function eofInText(p, token) {
    p._err(token, ERR.eofInElementThatCanContainOnlyText);
    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
    p.onEof(token);
}
// The "in table" insertion mode
//------------------------------------------------------------------
function characterInTable(p, token) {
    if (p.openElements.currentTagId !== undefined && TABLE_STRUCTURE_TAGS.has(p.openElements.currentTagId)) {
        p.pendingCharacterTokens.length = 0;
        p.hasNonWhitespacePendingCharacterToken = false;
        p.originalInsertionMode = p.insertionMode;
        p.insertionMode = InsertionMode.IN_TABLE_TEXT;
        switch (token.type) {
            case TokenType.CHARACTER: {
                characterInTableText(p, token);
                break;
            }
            case TokenType.WHITESPACE_CHARACTER: {
                whitespaceCharacterInTableText(p, token);
                break;
            }
            // Ignore null
        }
    }
    else {
        tokenInTable(p, token);
    }
}
function captionStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p.activeFormattingElements.insertMarker();
    p._insertElement(token, NS.HTML);
    p.insertionMode = InsertionMode.IN_CAPTION;
}
function colgroupStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
}
function colStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertFakeElement(TAG_NAMES.COLGROUP, TAG_ID.COLGROUP);
    p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
    startTagInColumnGroup(p, token);
}
function tbodyStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = InsertionMode.IN_TABLE_BODY;
}
function tdStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertFakeElement(TAG_NAMES.TBODY, TAG_ID.TBODY);
    p.insertionMode = InsertionMode.IN_TABLE_BODY;
    startTagInTableBody(p, token);
}
function tableStartTagInTable(p, token) {
    if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
        p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
        p._resetInsertionMode();
        p._processStartTag(token);
    }
}
function inputStartTagInTable(p, token) {
    if (isHiddenInput(token)) {
        p._appendElement(token, NS.HTML);
    }
    else {
        tokenInTable(p, token);
    }
    token.ackSelfClosing = true;
}
function formStartTagInTable(p, token) {
    if (!p.formElement && p.openElements.tmplCount === 0) {
        p._insertElement(token, NS.HTML);
        p.formElement = p.openElements.current;
        p.openElements.pop();
    }
}
function startTagInTable(p, token) {
    switch (token.tagID) {
        case TAG_ID.TD:
        case TAG_ID.TH:
        case TAG_ID.TR: {
            tdStartTagInTable(p, token);
            break;
        }
        case TAG_ID.STYLE:
        case TAG_ID.SCRIPT:
        case TAG_ID.TEMPLATE: {
            startTagInHead(p, token);
            break;
        }
        case TAG_ID.COL: {
            colStartTagInTable(p, token);
            break;
        }
        case TAG_ID.FORM: {
            formStartTagInTable(p, token);
            break;
        }
        case TAG_ID.TABLE: {
            tableStartTagInTable(p, token);
            break;
        }
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD: {
            tbodyStartTagInTable(p, token);
            break;
        }
        case TAG_ID.INPUT: {
            inputStartTagInTable(p, token);
            break;
        }
        case TAG_ID.CAPTION: {
            captionStartTagInTable(p, token);
            break;
        }
        case TAG_ID.COLGROUP: {
            colgroupStartTagInTable(p, token);
            break;
        }
        default: {
            tokenInTable(p, token);
        }
    }
}
function endTagInTable(p, token) {
    switch (token.tagID) {
        case TAG_ID.TABLE: {
            if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
                p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
                p._resetInsertionMode();
            }
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.HTML:
        case TAG_ID.TBODY:
        case TAG_ID.TD:
        case TAG_ID.TFOOT:
        case TAG_ID.TH:
        case TAG_ID.THEAD:
        case TAG_ID.TR: {
            // Ignore token
            break;
        }
        default: {
            tokenInTable(p, token);
        }
    }
}
function tokenInTable(p, token) {
    const savedFosterParentingState = p.fosterParentingEnabled;
    p.fosterParentingEnabled = true;
    // Process token in `In Body` mode
    modeInBody(p, token);
    p.fosterParentingEnabled = savedFosterParentingState;
}
// The "in table text" insertion mode
//------------------------------------------------------------------
function whitespaceCharacterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
}
function characterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
    p.hasNonWhitespacePendingCharacterToken = true;
}
function tokenInTableText(p, token) {
    let i = 0;
    if (p.hasNonWhitespacePendingCharacterToken) {
        for (; i < p.pendingCharacterTokens.length; i++) {
            tokenInTable(p, p.pendingCharacterTokens[i]);
        }
    }
    else {
        for (; i < p.pendingCharacterTokens.length; i++) {
            p._insertCharacters(p.pendingCharacterTokens[i]);
        }
    }
    p.insertionMode = p.originalInsertionMode;
    p._processToken(token);
}
// The "in caption" insertion mode
//------------------------------------------------------------------
const TABLE_VOID_ELEMENTS = new Set([TAG_ID.CAPTION, TAG_ID.COL, TAG_ID.COLGROUP, TAG_ID.TBODY, TAG_ID.TD, TAG_ID.TFOOT, TAG_ID.TH, TAG_ID.THEAD, TAG_ID.TR]);
function startTagInCaption(p, token) {
    const tn = token.tagID;
    if (TABLE_VOID_ELEMENTS.has(tn)) {
        if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = InsertionMode.IN_TABLE;
            startTagInTable(p, token);
        }
    }
    else {
        startTagInBody(p, token);
    }
}
function endTagInCaption(p, token) {
    const tn = token.tagID;
    switch (tn) {
        case TAG_ID.CAPTION:
        case TAG_ID.TABLE: {
            if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
                p.openElements.generateImpliedEndTags();
                p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
                p.activeFormattingElements.clearToLastMarker();
                p.insertionMode = InsertionMode.IN_TABLE;
                if (tn === TAG_ID.TABLE) {
                    endTagInTable(p, token);
                }
            }
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.HTML:
        case TAG_ID.TBODY:
        case TAG_ID.TD:
        case TAG_ID.TFOOT:
        case TAG_ID.TH:
        case TAG_ID.THEAD:
        case TAG_ID.TR: {
            // Ignore token
            break;
        }
        default: {
            endTagInBody(p, token);
        }
    }
}
// The "in column group" insertion mode
//------------------------------------------------------------------
function startTagInColumnGroup(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.COL: {
            p._appendElement(token, NS.HTML);
            token.ackSelfClosing = true;
            break;
        }
        case TAG_ID.TEMPLATE: {
            startTagInHead(p, token);
            break;
        }
        default: {
            tokenInColumnGroup(p, token);
        }
    }
}
function endTagInColumnGroup(p, token) {
    switch (token.tagID) {
        case TAG_ID.COLGROUP: {
            if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE;
            }
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        case TAG_ID.COL: {
            // Ignore token
            break;
        }
        default: {
            tokenInColumnGroup(p, token);
        }
    }
}
function tokenInColumnGroup(p, token) {
    if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
        p.openElements.pop();
        p.insertionMode = InsertionMode.IN_TABLE;
        p._processToken(token);
    }
}
// The "in table body" insertion mode
//------------------------------------------------------------------
function startTagInTableBody(p, token) {
    switch (token.tagID) {
        case TAG_ID.TR: {
            p.openElements.clearBackToTableBodyContext();
            p._insertElement(token, NS.HTML);
            p.insertionMode = InsertionMode.IN_ROW;
            break;
        }
        case TAG_ID.TH:
        case TAG_ID.TD: {
            p.openElements.clearBackToTableBodyContext();
            p._insertFakeElement(TAG_NAMES.TR, TAG_ID.TR);
            p.insertionMode = InsertionMode.IN_ROW;
            startTagInRow(p, token);
            break;
        }
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD: {
            if (p.openElements.hasTableBodyContextInTableScope()) {
                p.openElements.clearBackToTableBodyContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE;
                startTagInTable(p, token);
            }
            break;
        }
        default: {
            startTagInTable(p, token);
        }
    }
}
function endTagInTableBody(p, token) {
    const tn = token.tagID;
    switch (token.tagID) {
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD: {
            if (p.openElements.hasInTableScope(tn)) {
                p.openElements.clearBackToTableBodyContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE;
            }
            break;
        }
        case TAG_ID.TABLE: {
            if (p.openElements.hasTableBodyContextInTableScope()) {
                p.openElements.clearBackToTableBodyContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE;
                endTagInTable(p, token);
            }
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.HTML:
        case TAG_ID.TD:
        case TAG_ID.TH:
        case TAG_ID.TR: {
            // Ignore token
            break;
        }
        default: {
            endTagInTable(p, token);
        }
    }
}
// The "in row" insertion mode
//------------------------------------------------------------------
function startTagInRow(p, token) {
    switch (token.tagID) {
        case TAG_ID.TH:
        case TAG_ID.TD: {
            p.openElements.clearBackToTableRowContext();
            p._insertElement(token, NS.HTML);
            p.insertionMode = InsertionMode.IN_CELL;
            p.activeFormattingElements.insertMarker();
            break;
        }
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD:
        case TAG_ID.TR: {
            if (p.openElements.hasInTableScope(TAG_ID.TR)) {
                p.openElements.clearBackToTableRowContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE_BODY;
                startTagInTableBody(p, token);
            }
            break;
        }
        default: {
            startTagInTable(p, token);
        }
    }
}
function endTagInRow(p, token) {
    switch (token.tagID) {
        case TAG_ID.TR: {
            if (p.openElements.hasInTableScope(TAG_ID.TR)) {
                p.openElements.clearBackToTableRowContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE_BODY;
            }
            break;
        }
        case TAG_ID.TABLE: {
            if (p.openElements.hasInTableScope(TAG_ID.TR)) {
                p.openElements.clearBackToTableRowContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE_BODY;
                endTagInTableBody(p, token);
            }
            break;
        }
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD: {
            if (p.openElements.hasInTableScope(token.tagID) || p.openElements.hasInTableScope(TAG_ID.TR)) {
                p.openElements.clearBackToTableRowContext();
                p.openElements.pop();
                p.insertionMode = InsertionMode.IN_TABLE_BODY;
                endTagInTableBody(p, token);
            }
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.HTML:
        case TAG_ID.TD:
        case TAG_ID.TH: {
            // Ignore end tag
            break;
        }
        default: {
            endTagInTable(p, token);
        }
    }
}
// The "in cell" insertion mode
//------------------------------------------------------------------
function startTagInCell(p, token) {
    const tn = token.tagID;
    if (TABLE_VOID_ELEMENTS.has(tn)) {
        if (p.openElements.hasInTableScope(TAG_ID.TD) || p.openElements.hasInTableScope(TAG_ID.TH)) {
            p._closeTableCell();
            startTagInRow(p, token);
        }
    }
    else {
        startTagInBody(p, token);
    }
}
function endTagInCell(p, token) {
    const tn = token.tagID;
    switch (tn) {
        case TAG_ID.TD:
        case TAG_ID.TH: {
            if (p.openElements.hasInTableScope(tn)) {
                p.openElements.generateImpliedEndTags();
                p.openElements.popUntilTagNamePopped(tn);
                p.activeFormattingElements.clearToLastMarker();
                p.insertionMode = InsertionMode.IN_ROW;
            }
            break;
        }
        case TAG_ID.TABLE:
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD:
        case TAG_ID.TR: {
            if (p.openElements.hasInTableScope(tn)) {
                p._closeTableCell();
                endTagInRow(p, token);
            }
            break;
        }
        case TAG_ID.BODY:
        case TAG_ID.CAPTION:
        case TAG_ID.COL:
        case TAG_ID.COLGROUP:
        case TAG_ID.HTML: {
            // Ignore token
            break;
        }
        default: {
            endTagInBody(p, token);
        }
    }
}
// The "in select" insertion mode
//------------------------------------------------------------------
function startTagInSelect(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.OPTION: {
            if (p.openElements.currentTagId === TAG_ID.OPTION) {
                p.openElements.pop();
            }
            p._insertElement(token, NS.HTML);
            break;
        }
        case TAG_ID.OPTGROUP: {
            if (p.openElements.currentTagId === TAG_ID.OPTION) {
                p.openElements.pop();
            }
            if (p.openElements.currentTagId === TAG_ID.OPTGROUP) {
                p.openElements.pop();
            }
            p._insertElement(token, NS.HTML);
            break;
        }
        case TAG_ID.HR: {
            if (p.openElements.currentTagId === TAG_ID.OPTION) {
                p.openElements.pop();
            }
            if (p.openElements.currentTagId === TAG_ID.OPTGROUP) {
                p.openElements.pop();
            }
            p._appendElement(token, NS.HTML);
            token.ackSelfClosing = true;
            break;
        }
        case TAG_ID.INPUT:
        case TAG_ID.KEYGEN:
        case TAG_ID.TEXTAREA:
        case TAG_ID.SELECT: {
            if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
                p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
                p._resetInsertionMode();
                if (token.tagID !== TAG_ID.SELECT) {
                    p._processStartTag(token);
                }
            }
            break;
        }
        case TAG_ID.SCRIPT:
        case TAG_ID.TEMPLATE: {
            startTagInHead(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
function endTagInSelect(p, token) {
    switch (token.tagID) {
        case TAG_ID.OPTGROUP: {
            if (p.openElements.stackTop > 0 &&
                p.openElements.currentTagId === TAG_ID.OPTION &&
                p.openElements.tagIDs[p.openElements.stackTop - 1] === TAG_ID.OPTGROUP) {
                p.openElements.pop();
            }
            if (p.openElements.currentTagId === TAG_ID.OPTGROUP) {
                p.openElements.pop();
            }
            break;
        }
        case TAG_ID.OPTION: {
            if (p.openElements.currentTagId === TAG_ID.OPTION) {
                p.openElements.pop();
            }
            break;
        }
        case TAG_ID.SELECT: {
            if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
                p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
                p._resetInsertionMode();
            }
            break;
        }
        case TAG_ID.TEMPLATE: {
            templateEndTagInHead(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
// The "in select in table" insertion mode
//------------------------------------------------------------------
function startTagInSelectInTable(p, token) {
    const tn = token.tagID;
    if (tn === TAG_ID.CAPTION ||
        tn === TAG_ID.TABLE ||
        tn === TAG_ID.TBODY ||
        tn === TAG_ID.TFOOT ||
        tn === TAG_ID.THEAD ||
        tn === TAG_ID.TR ||
        tn === TAG_ID.TD ||
        tn === TAG_ID.TH) {
        p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
        p._resetInsertionMode();
        p._processStartTag(token);
    }
    else {
        startTagInSelect(p, token);
    }
}
function endTagInSelectInTable(p, token) {
    const tn = token.tagID;
    if (tn === TAG_ID.CAPTION ||
        tn === TAG_ID.TABLE ||
        tn === TAG_ID.TBODY ||
        tn === TAG_ID.TFOOT ||
        tn === TAG_ID.THEAD ||
        tn === TAG_ID.TR ||
        tn === TAG_ID.TD ||
        tn === TAG_ID.TH) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
            p._resetInsertionMode();
            p.onEndTag(token);
        }
    }
    else {
        endTagInSelect(p, token);
    }
}
// The "in template" insertion mode
//------------------------------------------------------------------
function startTagInTemplate(p, token) {
    switch (token.tagID) {
        // First, handle tags that can start without a mode change
        case TAG_ID.BASE:
        case TAG_ID.BASEFONT:
        case TAG_ID.BGSOUND:
        case TAG_ID.LINK:
        case TAG_ID.META:
        case TAG_ID.NOFRAMES:
        case TAG_ID.SCRIPT:
        case TAG_ID.STYLE:
        case TAG_ID.TEMPLATE:
        case TAG_ID.TITLE: {
            startTagInHead(p, token);
            break;
        }
        // Re-process the token in the appropriate mode
        case TAG_ID.CAPTION:
        case TAG_ID.COLGROUP:
        case TAG_ID.TBODY:
        case TAG_ID.TFOOT:
        case TAG_ID.THEAD: {
            p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE;
            p.insertionMode = InsertionMode.IN_TABLE;
            startTagInTable(p, token);
            break;
        }
        case TAG_ID.COL: {
            p.tmplInsertionModeStack[0] = InsertionMode.IN_COLUMN_GROUP;
            p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
            startTagInColumnGroup(p, token);
            break;
        }
        case TAG_ID.TR: {
            p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE_BODY;
            p.insertionMode = InsertionMode.IN_TABLE_BODY;
            startTagInTableBody(p, token);
            break;
        }
        case TAG_ID.TD:
        case TAG_ID.TH: {
            p.tmplInsertionModeStack[0] = InsertionMode.IN_ROW;
            p.insertionMode = InsertionMode.IN_ROW;
            startTagInRow(p, token);
            break;
        }
        default: {
            p.tmplInsertionModeStack[0] = InsertionMode.IN_BODY;
            p.insertionMode = InsertionMode.IN_BODY;
            startTagInBody(p, token);
        }
    }
}
function endTagInTemplate(p, token) {
    if (token.tagID === TAG_ID.TEMPLATE) {
        templateEndTagInHead(p, token);
    }
}
function eofInTemplate(p, token) {
    if (p.openElements.tmplCount > 0) {
        p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
        p.activeFormattingElements.clearToLastMarker();
        p.tmplInsertionModeStack.shift();
        p._resetInsertionMode();
        p.onEof(token);
    }
    else {
        stopParsing(p, token);
    }
}
// The "after body" insertion mode
//------------------------------------------------------------------
function startTagAfterBody(p, token) {
    if (token.tagID === TAG_ID.HTML) {
        startTagInBody(p, token);
    }
    else {
        tokenAfterBody(p, token);
    }
}
function endTagAfterBody(p, token) {
    var _a;
    if (token.tagID === TAG_ID.HTML) {
        if (!p.fragmentContext) {
            p.insertionMode = InsertionMode.AFTER_AFTER_BODY;
        }
        //NOTE: <html> is never popped from the stack, so we need to updated
        //the end location explicitly.
        if (p.options.sourceCodeLocationInfo && p.openElements.tagIDs[0] === TAG_ID.HTML) {
            p._setEndLocation(p.openElements.items[0], token);
            // Update the body element, if it doesn't have an end tag
            const bodyElement = p.openElements.items[1];
            if (bodyElement && !((_a = p.treeAdapter.getNodeSourceCodeLocation(bodyElement)) === null || _a === void 0 ? void 0 : _a.endTag)) {
                p._setEndLocation(bodyElement, token);
            }
        }
    }
    else {
        tokenAfterBody(p, token);
    }
}
function tokenAfterBody(p, token) {
    p.insertionMode = InsertionMode.IN_BODY;
    modeInBody(p, token);
}
// The "in frameset" insertion mode
//------------------------------------------------------------------
function startTagInFrameset(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.FRAMESET: {
            p._insertElement(token, NS.HTML);
            break;
        }
        case TAG_ID.FRAME: {
            p._appendElement(token, NS.HTML);
            token.ackSelfClosing = true;
            break;
        }
        case TAG_ID.NOFRAMES: {
            startTagInHead(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
function endTagInFrameset(p, token) {
    if (token.tagID === TAG_ID.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
        p.openElements.pop();
        if (!p.fragmentContext && p.openElements.currentTagId !== TAG_ID.FRAMESET) {
            p.insertionMode = InsertionMode.AFTER_FRAMESET;
        }
    }
}
// The "after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterFrameset(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.NOFRAMES: {
            startTagInHead(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
function endTagAfterFrameset(p, token) {
    if (token.tagID === TAG_ID.HTML) {
        p.insertionMode = InsertionMode.AFTER_AFTER_FRAMESET;
    }
}
// The "after after body" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterBody(p, token) {
    if (token.tagID === TAG_ID.HTML) {
        startTagInBody(p, token);
    }
    else {
        tokenAfterAfterBody(p, token);
    }
}
function tokenAfterAfterBody(p, token) {
    p.insertionMode = InsertionMode.IN_BODY;
    modeInBody(p, token);
}
// The "after after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterFrameset(p, token) {
    switch (token.tagID) {
        case TAG_ID.HTML: {
            startTagInBody(p, token);
            break;
        }
        case TAG_ID.NOFRAMES: {
            startTagInHead(p, token);
            break;
        }
        default:
        // Do nothing
    }
}
// The rules for parsing tokens in foreign content
//------------------------------------------------------------------
function nullCharacterInForeignContent(p, token) {
    token.chars = REPLACEMENT_CHARACTER;
    p._insertCharacters(token);
}
function characterInForeignContent(p, token) {
    p._insertCharacters(token);
    p.framesetOk = false;
}
function popUntilHtmlOrIntegrationPoint(p) {
    while (p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML &&
        p.openElements.currentTagId !== undefined &&
        !p._isIntegrationPoint(p.openElements.currentTagId, p.openElements.current)) {
        p.openElements.pop();
    }
}
function startTagInForeignContent(p, token) {
    if (causesExit(token)) {
        popUntilHtmlOrIntegrationPoint(p);
        p._startTagOutsideForeignContent(token);
    }
    else {
        const current = p._getAdjustedCurrentElement();
        const currentNs = p.treeAdapter.getNamespaceURI(current);
        if (currentNs === NS.MATHML) {
            adjustTokenMathMLAttrs(token);
        }
        else if (currentNs === NS.SVG) {
            adjustTokenSVGTagName(token);
            adjustTokenSVGAttrs(token);
        }
        adjustTokenXMLAttrs(token);
        if (token.selfClosing) {
            p._appendElement(token, currentNs);
        }
        else {
            p._insertElement(token, currentNs);
        }
        token.ackSelfClosing = true;
    }
}
function endTagInForeignContent(p, token) {
    if (token.tagID === TAG_ID.P || token.tagID === TAG_ID.BR) {
        popUntilHtmlOrIntegrationPoint(p);
        p._endTagOutsideForeignContent(token);
        return;
    }
    for (let i = p.openElements.stackTop; i > 0; i--) {
        const element = p.openElements.items[i];
        if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
            p._endTagOutsideForeignContent(token);
            break;
        }
        const tagName = p.treeAdapter.getTagName(element);
        if (tagName.toLowerCase() === token.tagName) {
            //NOTE: update the token tag name for `_setEndLocation`.
            token.tagName = tagName;
            p.openElements.shortenToLength(i);
            break;
        }
    }
}

;// ./node_modules/parse5/node_modules/entities/dist/esm/escape.js
const xmlReplacer = /["$&'<>\u0080-\uFFFF]/g;
const xmlCodeMap = new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [39, "&apos;"],
    [60, "&lt;"],
    [62, "&gt;"],
]);
// For compatibility with node < 4, we wrap `codePointAt`
const getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt == null
    ? (c, index) => (c.charCodeAt(index) & 64512) === 55296
        ? (c.charCodeAt(index) - 55296) * 1024 +
            c.charCodeAt(index + 1) -
            56320 +
            65536
        : c.charCodeAt(index)
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        (input, index) => input.codePointAt(index);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
function encodeXML(input) {
    let returnValue = "";
    let lastIndex = 0;
    let match;
    while ((match = xmlReplacer.exec(input)) !== null) {
        const { index } = match;
        const char = input.charCodeAt(index);
        const next = xmlCodeMap.get(char);
        if (next === undefined) {
            returnValue += `${input.substring(lastIndex, index)}&#x${getCodePoint(input, index).toString(16)};`;
            // Increase by 1 if we have a surrogate pair
            lastIndex = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
        }
        else {
            returnValue += input.substring(lastIndex, index) + next;
            lastIndex = index + 1;
        }
    }
    return returnValue + input.substr(lastIndex);
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
const escape_escape = (/* unused pure expression or super */ null && (encodeXML));
/**
 * Creates a function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 *
 * @param regex Regular expression to match characters to escape.
 * @param map Map of characters to escape to their entities.
 *
 * @returns Function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 */
function getEscaper(regex, map) {
    return function escape(data) {
        let match;
        let lastIndex = 0;
        let result = "";
        while ((match = regex.exec(data))) {
            if (lastIndex !== match.index) {
                result += data.substring(lastIndex, match.index);
            }
            // We know that this character will be in the map.
            result += map.get(match[0].charCodeAt(0));
            // Every match will be of length 1
            lastIndex = match.index + 1;
        }
        return result + data.substring(lastIndex);
    };
}
/**
 * Encodes all characters not valid in XML documents using XML entities.
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
const escapeUTF8 = /* #__PURE__ */ (/* unused pure expression or super */ null && (getEscaper(/["&'<>]/g, xmlCodeMap)));
/**
 * Encodes all characters that have to be escaped in HTML attributes,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
const escapeAttribute = 
/* #__PURE__ */ getEscaper(/["&\u00A0]/g, new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [160, "&nbsp;"],
]));
/**
 * Encodes all characters that have to be escaped in HTML text,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 *
 * @param data String to escape.
 */
const escapeText = /* #__PURE__ */ getEscaper(/[&<>\u00A0]/g, new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [160, "&nbsp;"],
]));

;// ./node_modules/parse5/dist/serializer/index.js



// Sets
const VOID_ELEMENTS = new Set([
    TAG_NAMES.AREA,
    TAG_NAMES.BASE,
    TAG_NAMES.BASEFONT,
    TAG_NAMES.BGSOUND,
    TAG_NAMES.BR,
    TAG_NAMES.COL,
    TAG_NAMES.EMBED,
    TAG_NAMES.FRAME,
    TAG_NAMES.HR,
    TAG_NAMES.IMG,
    TAG_NAMES.INPUT,
    TAG_NAMES.KEYGEN,
    TAG_NAMES.LINK,
    TAG_NAMES.META,
    TAG_NAMES.PARAM,
    TAG_NAMES.SOURCE,
    TAG_NAMES.TRACK,
    TAG_NAMES.WBR,
]);
function isVoidElement(node, options) {
    return (options.treeAdapter.isElementNode(node) &&
        options.treeAdapter.getNamespaceURI(node) === NS.HTML &&
        VOID_ELEMENTS.has(options.treeAdapter.getTagName(node)));
}
const defaultOpts = { treeAdapter: defaultTreeAdapter, scriptingEnabled: true };
/**
 * Serializes an AST node to an HTML string.
 *
 * @example
 *
 * ```js
 * const parse5 = require('parse5');
 *
 * const document = parse5.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>');
 *
 * // Serializes a document.
 * const html = parse5.serialize(document);
 *
 * // Serializes the <html> element content.
 * const str = parse5.serialize(document.childNodes[1]);
 *
 * console.log(str); //> '<head></head><body>Hi there!</body>'
 * ```
 *
 * @param node Node to serialize.
 * @param options Serialization options.
 */
function serialize(node, options) {
    const opts = { ...defaultOpts, ...options };
    if (isVoidElement(node, opts)) {
        return '';
    }
    return serializeChildNodes(node, opts);
}
/**
 * Serializes an AST element node to an HTML string, including the element node.
 *
 * @example
 *
 * ```js
 * const parse5 = require('parse5');
 *
 * const document = parse5.parseFragment('<div>Hello, <b>world</b>!</div>');
 *
 * // Serializes the <div> element.
 * const str = parse5.serializeOuter(document.childNodes[0]);
 *
 * console.log(str); //> '<div>Hello, <b>world</b>!</div>'
 * ```
 *
 * @param node Node to serialize.
 * @param options Serialization options.
 */
function serializeOuter(node, options) {
    const opts = { ...defaultOpts, ...options };
    return serializeNode(node, opts);
}
function serializeChildNodes(parentNode, options) {
    let html = '';
    // Get container of the child nodes
    const container = options.treeAdapter.isElementNode(parentNode) &&
        options.treeAdapter.getTagName(parentNode) === TAG_NAMES.TEMPLATE &&
        options.treeAdapter.getNamespaceURI(parentNode) === NS.HTML
        ? options.treeAdapter.getTemplateContent(parentNode)
        : parentNode;
    const childNodes = options.treeAdapter.getChildNodes(container);
    if (childNodes) {
        for (const currentNode of childNodes) {
            html += serializeNode(currentNode, options);
        }
    }
    return html;
}
function serializeNode(node, options) {
    if (options.treeAdapter.isElementNode(node)) {
        return serializeElement(node, options);
    }
    if (options.treeAdapter.isTextNode(node)) {
        return serializeTextNode(node, options);
    }
    if (options.treeAdapter.isCommentNode(node)) {
        return serializeCommentNode(node, options);
    }
    if (options.treeAdapter.isDocumentTypeNode(node)) {
        return serializeDocumentTypeNode(node, options);
    }
    // Return an empty string for unknown nodes
    return '';
}
function serializeElement(node, options) {
    const tn = options.treeAdapter.getTagName(node);
    return `<${tn}${serializeAttributes(node, options)}>${isVoidElement(node, options) ? '' : `${serializeChildNodes(node, options)}</${tn}>`}`;
}
function serializeAttributes(node, { treeAdapter }) {
    let html = '';
    for (const attr of treeAdapter.getAttrList(node)) {
        html += ' ';
        if (attr.namespace) {
            switch (attr.namespace) {
                case NS.XML: {
                    html += `xml:${attr.name}`;
                    break;
                }
                case NS.XMLNS: {
                    if (attr.name !== 'xmlns') {
                        html += 'xmlns:';
                    }
                    html += attr.name;
                    break;
                }
                case NS.XLINK: {
                    html += `xlink:${attr.name}`;
                    break;
                }
                default: {
                    html += `${attr.prefix}:${attr.name}`;
                }
            }
        }
        else {
            html += attr.name;
        }
        html += `="${escapeAttribute(attr.value)}"`;
    }
    return html;
}
function serializeTextNode(node, options) {
    const { treeAdapter } = options;
    const content = treeAdapter.getTextNodeContent(node);
    const parent = treeAdapter.getParentNode(node);
    const parentTn = parent && treeAdapter.isElementNode(parent) && treeAdapter.getTagName(parent);
    return parentTn &&
        treeAdapter.getNamespaceURI(parent) === NS.HTML &&
        hasUnescapedText(parentTn, options.scriptingEnabled)
        ? content
        : escapeText(content);
}
function serializeCommentNode(node, { treeAdapter }) {
    return `<!--${treeAdapter.getCommentNodeContent(node)}-->`;
}
function serializeDocumentTypeNode(node, { treeAdapter }) {
    return `<!DOCTYPE ${treeAdapter.getDocumentTypeNodeName(node)}>`;
}

;// ./node_modules/parse5/dist/index.js





/** @internal */



/** @internal */

// Shorthands
/**
 * Parses an HTML string.
 *
 * @param html Input HTML string.
 * @param options Parsing options.
 * @returns Document
 *
 * @example
 *
 * ```js
 * const parse5 = require('parse5');
 *
 * const document = parse5.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>');
 *
 * console.log(document.childNodes[1].tagName); //> 'html'
 *```
 */
function parse(html, options) {
    return Parser.parse(html, options);
}
function parseFragment(fragmentContext, html, options) {
    if (typeof fragmentContext === 'string') {
        options = html;
        html = fragmentContext;
        fragmentContext = null;
    }
    const parser = Parser.getFragmentParser(fragmentContext, options);
    parser.tokenizer.write(html, true);
    return parser.getFragment();
}


/***/ }),

/***/ 250:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PE: () => (/* binding */ downloadFile),
/* harmony export */   QM: () => (/* binding */ uploadFile),
/* harmony export */   Ww: () => (/* binding */ deleteFile),
/* harmony export */   vl: () => (/* binding */ getObjectUrl),
/* harmony export */   yi: () => (/* binding */ batchDelete)
/* harmony export */ });
/* unused harmony exports copyFile, listObjects */
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(444);
/* harmony import */ var _utils_fileValidation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(675);
/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 */




/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function createSuccessResponse(data = null, message = null) {
  const response = {
    success: true,
    data
  };

  // Add message to data if provided
  if (message && typeof data === 'object' && data !== null) {
    response.data = {
      ...data,
      message
    };
  } else if (message) {
    response.data = {
      message
    };
  }
  return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
function createErrorResponse(error, errors = null) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  const response = {
    success: false,
    error: errorMessage
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

/**
 * Upload a file to local filesystem via REST API.
 *
 * @param {string}    staticPath Base path for static files.
 * @param {string}    key        File path/key relative to static path.
 * @param {File|Blob} file       File to upload.
 * @param {Object}    options    Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
async function uploadFile(staticPath, key, file, options = {}) {
  try {
    // Validate key parameter
    if (!key || key === '') {
      const error = new Error(`Upload key is empty. File: ${file?.name || 'unknown'}, staticPath: ${staticPath}`);
      return createErrorResponse(error.message);
    }

    // Client-side validation for instant feedback
    const validation = (0,_utils_fileValidation__WEBPACK_IMPORTED_MODULE_1__/* .validateFile */ .nJ)(file, key);
    if (!validation.valid) {
      return createErrorResponse(validation.error);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('static_path', staticPath);
    if (options.contentType) {
      formData.append('content_type', options.contentType);
    }
    let response;
    try {
      response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: '/aether/site-exporter/local-storage/upload',
        method: 'POST',
        body: formData
      });
    } catch (apiError) {
      // WordPress REST API throws errors for WP_Error responses
      // Extract detailed error information if available
      const errorMessage = apiError?.message || apiError?.data?.message || apiError?.code || 'Upload failed';

      // Include additional error details if available (destination, source, etc.)
      const errorDetails = [];
      if (apiError?.data?.destination) {
        errorDetails.push(`Destination: ${apiError.data.destination}`);
      }
      if (apiError?.data?.source) {
        errorDetails.push(`Source: ${apiError.data.source}`);
      }
      if (apiError?.data?.system_error) {
        errorDetails.push(`System: ${apiError.data.system_error}`);
      }
      const fullErrorMessage = errorDetails.length > 0 ? `${errorMessage} (${errorDetails.join(', ')})` : errorMessage;
      return createErrorResponse(fullErrorMessage);
    }
    if (!response.success) {
      // Extract detailed error information from response
      const errorMessage = response.error || response.message || 'Upload failed';
      const errorDetails = [];
      if (response.destination) {
        errorDetails.push(`Destination: ${response.destination}`);
      }
      if (response.source) {
        errorDetails.push(`Source: ${response.source}`);
      }
      if (response.system_error) {
        errorDetails.push(`System: ${response.system_error}`);
      }
      const fullErrorMessage = errorDetails.length > 0 ? `${errorMessage} (${errorDetails.join(', ')})` : errorMessage;
      return createErrorResponse(fullErrorMessage);
    }

    // Call progress callback if provided (100% since we don't have chunked upload yet)
    if (options.onProgress) {
      options.onProgress(file.size, file.size, 100);
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Upload failed');
  }
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @return {Promise<Object>} Delete result.
 */
async function deleteFile(staticPath, key) {
  try {
    const response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Delete failed');
  }
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @return {Promise<Object>} Copy result.
 */
async function copyFile() {
  // Not implemented for local filesystem
  // Files are uploaded directly to their final location
  return createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @return {Promise<Object>} List result.
 */
async function listObjects() {
  // Not implemented - not needed for static site generation
  // Static site generator doesn't need to list existing files
  return createSuccessResponse({
    objects: []
  });
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @return {Promise<Object>} Batch delete result.
 */
async function batchDelete(staticPath, keys) {
  try {
    const response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Batch delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    return createErrorResponse(error.message || 'Batch delete failed');
  }
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
async function downloadFile(staticPath, key) {
  try {
    const response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    return null;
  }
}

/**
 * Get public URL for a file.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} baseUrl    Base URL for static files.
 * @param {string} key        File path/key.
 * @return {string} Public URL.
 */
function getObjectUrl(staticPath, baseUrl, key) {
  // For local filesystem, construct URL from baseUrl and key
  // Remove any trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Remove leading slash from key if present
  const cleanKey = key.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanKey}`;
}

/***/ }),

/***/ 444:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ay: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports setAPINonce, configureAPI */
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);
/**
 * API Fetch Utility
 *
 * Wrapper around @wordpress/api-fetch with:
 * - Nonce handling from window.aetherData
 * - Auth header utilities for external APIs
 */



/**
 * Get REST API base URL from window.aetherData or default.
 *
 * @return {string} REST API base URL (without namespace).
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.restUrl) {
    return window.aetherData.restUrl;
  }
  return '/wp-json/';
}

/**
 * Get REST API nonce from window.aetherData or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.nonce) {
    return window.aetherData.nonce;
  }
  return '';
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL and nonce.
 * Automatically fetches from window.aetherData if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from window.aetherData if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from window.aetherData if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()));

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 675:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nJ: () => (/* binding */ validateFile)
/* harmony export */ });
/* unused harmony exports formatFileSize, getFileExtension, validateFileSize, validateFileExtension, validateFileMimeType */
/**
 * File Validation Utilities
 *
 * Client-side file validation for uploads.
 * Provides instant feedback before hitting the server.
 * PHP still validates as security backstop.
 */

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
// Images
'css', 'js', 'json',
// Web assets
'woff', 'woff2', 'ttf', 'eot',
// Fonts
'pdf', 'txt', 'md',
// Documents
'zip', 'tar', 'gz',
// Archives
'html', 'htm', 'xml' // Markup
];

// Expected MIME types for extensions
const MIME_TYPE_MAP = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  // Web assets
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  eot: 'application/vnd.ms-fontobject',
  // Documents
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  // Archives
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  // Markup
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml'
};

/**
 * Format file size in human-readable format.
 *
 * @param {number} bytes File size in bytes.
 * @return {string} Human-readable size (e.g., "1.5 MB").
 */
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename.
 *
 * @param {string} filename File name.
 * @return {string} Extension (lowercase, without dot).
 */
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Validate file size.
 *
 * @param {File|Blob} file File to validate.
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileSize(file) {
  if (!file || !file.size) {
    return {
      valid: true
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file extension.
 *
 * @param {string} filename File name or key.
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileExtension(filename) {
  const extension = getFileExtension(filename);

  // Allow files without extension (e.g., directory index files)
  if (extension === '') {
    return {
      valid: true
    };
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type "${extension}" is not allowed for upload. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file MIME type.
 *
 * @param {File|Blob} file     File to validate.
 * @param {string}    filename File name (to check extension).
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFileMimeType(file, filename) {
  if (!file || !file.type) {
    // No MIME type available (e.g., Blob without type)
    // Skip validation - PHP will handle it
    return {
      valid: true
    };
  }
  const extension = getFileExtension(filename);
  const expectedMimeType = MIME_TYPE_MAP[extension];

  // If we don't have an expected MIME type, allow it
  // (PHP will do final validation)
  if (!expectedMimeType) {
    return {
      valid: true
    };
  }

  // Check if MIME type matches expected
  if (file.type !== expectedMimeType) {
    // Allow common misidentifications
    const mimeType = file.type;

    // JavaScript files often misidentified
    if (extension === 'js' && (mimeType === 'text/plain' || mimeType === 'text/x-java' || mimeType === 'application/x-javascript' || mimeType === 'text/javascript')) {
      return {
        valid: true
      };
    }

    // Text-based files often detected as text/plain
    if (['css', 'html', 'htm', 'xml', 'txt', 'md'].includes(extension) && mimeType === 'text/plain') {
      return {
        valid: true
      };
    }
    return {
      valid: false,
      error: `File MIME type "${mimeType}" doesn't match expected type "${expectedMimeType}" for .${extension} files.`
    };
  }
  return {
    valid: true
  };
}

/**
 * Validate file completely (size, extension, MIME type).
 *
 * @param {File|Blob} file File to validate.
 * @param {string}    key  File key/name.
 * @return {Object} Validation result with valid boolean and error message.
 */
function validateFile(file, key) {
  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate file extension
  const extensionValidation = validateFileExtension(key);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  // Validate MIME type
  const mimeValidation = validateFileMimeType(file, key);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }
  return {
    valid: true
  };
}

/***/ }),

/***/ 906:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigStorage: () => (/* binding */ ConfigStorage)
/* harmony export */ });
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(444);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with REST API backend storage.
 */




/**
 * Configuration storage class.
 *
 * Provides REST API persistence for provider configurations.
 */
class ConfigStorage {
  /**
   * Provider ID.
   *
   * @type {string}
   */
  providerId;

  /**
   * Constructor.
   *
   * @param {string} providerId Provider ID.
   */
  constructor(providerId) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ConfigStorage requires a valid provider ID');
    }
    this.providerId = providerId;
  }

  /**
   * Load configuration from REST API.
   *
   * @return {Promise<Object>} Configuration object
   */
  async load() {
    try {
      const response = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'GET'
      });
      let config = response.config || {};

      /**
       * Filter provider configuration after loading from storage.
       *
       * Allows modification of config loaded from REST API.
       *
       * @param {Object} config     Loaded configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.storage.config.load', 'my-plugin', (config, providerId) => {
       *     if (providerId === 'my-provider') {
       *         config.autoLoaded = Date.now();
       *     }
       *     return config;
       * });
       */
      config = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.storage.config.load', config, this.providerId);

      /**
       * Action fired after configuration is loaded from storage.
       *
       * @param {Object} config     Loaded configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.loaded', 'my-plugin', (config, providerId) => {
       *     console.log(`Configuration loaded for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.loaded', config, this.providerId);
      return config;
    } catch (error) {
      // If provider not configured, return empty object
      if (error.code === 'restProviderNotConfigured' || error.status === 404) {
        return {};
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Save configuration to REST API.
   *
   * @param {Object} config Configuration object to save.
   * @return {Promise<boolean>} True if saved successfully
   */
  async save(config) {
    /**
     * Filter configuration before saving to storage.
     *
     * Allows modification of config before REST API call.
     *
     * @param {Object} config     Configuration to save.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.storage.config.before_save', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.lastSaved = Date.now();
     *     }
     *     return config;
     * });
     */
    config = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.storage.config.before_save', config, this.providerId);
    try {
      await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'POST',
        data: {
          config
        }
      });

      /**
       * Action fired after configuration is saved to storage.
       *
       * @param {Object} config     Saved configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.saved', 'my-plugin', (config, providerId) => {
       *     console.log(`Configuration saved for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.saved', config, this.providerId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete configuration from REST API.
   *
   * @return {Promise<boolean>} True if deleted successfully
   */
  async delete() {
    /**
     * Action fired before configuration is deleted from storage.
     *
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.storage.config.before_delete', 'my-plugin', (providerId) => {
     *     console.log(`Deleting configuration for ${providerId}`);
     * });
     */
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.before_delete', this.providerId);
    try {
      await (0,_utils_api__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Ay)({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'DELETE'
      });

      /**
       * Action fired after configuration is deleted from storage.
       *
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.storage.config.deleted', 'my-plugin', (providerId) => {
       *     console.log(`Configuration deleted for ${providerId}`);
       * });
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.storage.config.deleted', this.providerId);
      return true;
    } catch (error) {
      throw error;
    }
  }
}
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (ConfigStorage)));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/contexts/ExportContext.js
/**
 * Export Context
 *
 * Centralized export workflow state management using React Context API.
 * Provides global export state with step tracking, progress management, and status updates.
 *
 */



/**
 * Export Context
 *
 * @type {Object}
 */

const ExportContext = (0,external_wp_element_namespaceObject.createContext)({
  steps: [],
  isExporting: false,
  finalStatus: null,
  error: null,
  currentStatusMessage: null,
  overallProgress: 0,
  staticSiteProviders: [],
  blueprintBundleProviders: [],
  providerProgress: {},
  providerInstances: [],
  initializeSteps: () => {},
  setStepStatus: () => {},
  setStepProgress: () => {},
  setProviderProgress: () => {},
  setProviderInstances: () => {},
  updateFromStep: () => {},
  markAllComplete: () => {},
  showError: () => {},
  setIsExporting: () => {},
  setStatusMessage: () => {},
  setOverallProgressValue: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  setProviders: () => {},
  reset: () => {}
});

/**
 * Export Provider Component
 *
 * Wraps the export workflow to provide global state management.
 * Features:
 * - Step tracking (pending, active, complete, error)
 * - Progress management (per-step and overall)
 * - Status messages
 * - Error handling
 * - Progress never goes backwards (monotonic increase)
 * - Retry support (can restart from earlier steps)
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
function ExportProvider({
  children
}) {
  // Core state
  const [steps, setSteps] = (0,external_wp_element_namespaceObject.useState)([]);
  const [isExporting, setIsExporting] = (0,external_wp_element_namespaceObject.useState)(false);
  const [finalStatus, setFinalStatus] = (0,external_wp_element_namespaceObject.useState)(null);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [currentStatusMessage, setCurrentStatusMessage] = (0,external_wp_element_namespaceObject.useState)(null);
  const [overallProgress, setOverallProgress] = (0,external_wp_element_namespaceObject.useState)(0);
  const [messageHistory, setMessageHistory] = (0,external_wp_element_namespaceObject.useState)([]);
  const [staticSiteProviders, setStaticSiteProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [blueprintBundleProviders, setBlueprintBundleProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [providerProgress, setProviderProgressState] = (0,external_wp_element_namespaceObject.useState)({});
  const [providerInstances, setProviderInstancesState] = (0,external_wp_element_namespaceObject.useState)([]);

  // Track maximum progress to prevent progress from going backwards
  const maxProgressRef = (0,external_wp_element_namespaceObject.useRef)(0);

  /**
   * Initialize steps from step definitions
   *
   * @param {Array<Object>} stepDefinitions Step definitions with id, label, supportsProgress
   * @param {string|null}   initialStepId   Optional step ID to activate immediately
   */
  const initializeSteps = (0,external_wp_element_namespaceObject.useCallback)((stepDefinitions = [], initialStepId = null) => {
    const newSteps = stepDefinitions.map(stepDef => ({
      id: stepDef.id,
      label: stepDef.label,
      status: 'pending',
      supportsProgress: stepDef.supportsProgress || false,
      progress: {
        current: 0,
        total: 0
      }
    }));

    // If initialStepId is provided, activate it immediately
    let initialStepIndex = -1;
    if (initialStepId) {
      initialStepIndex = newSteps.findIndex(s => s.id === initialStepId);
      if (initialStepIndex !== -1) {
        newSteps[initialStepIndex].status = 'active';
      }
    }

    // Use functional update to ensure we're working with the latest state
    // This prevents race conditions with reset() or other state updates
    setSteps(() => newSteps);
    setError(null);
    setFinalStatus(null);
  }, []);

  /**
   * Set status for a specific step
   *
   * @param {string} stepId       Step ID
   * @param {string} status       Status: 'pending', 'active', 'complete', 'error'
   * @param {string} errorMessage Error message (only used when status is 'error')
   */
  const setStepStatus = (0,external_wp_element_namespaceObject.useCallback)((stepId, status, errorMessage = '') => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          errorMessage: status === 'error' ? errorMessage : ''
        };
      }
      return step;
    }));
  }, []);

  /**
   * Set progress for a specific step
   *
   * @param {string} stepId   Step ID
   * @param {Object} progress Progress object with `current` and `total` properties
   */
  const setStepProgress = (0,external_wp_element_namespaceObject.useCallback)((stepId, progress) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          progress: {
            current: Math.max(0, progress.current || 0),
            total: Math.max(0, progress.total || 0)
          }
        };
      }
      return step;
    }));
  }, []);

  /**
   * Set progress for a specific provider instance
   *
   * Used by ThreadOrchestrator to track per-provider progress.
   * Format: { [providerId]: { stepId, stepLabel, progress, status } }
   *
   * @param {string} providerId Provider instance ID
   * @param {Object} progress   Progress data { stepId, stepLabel, progress, status }
   */
  const setProviderProgress = (0,external_wp_element_namespaceObject.useCallback)((providerId, progressData) => {
    setProviderProgressState(prev => ({
      ...prev,
      [providerId]: {
        ...progressData,
        progress: {
          current: Math.max(0, progressData.progress?.current || 0),
          total: Math.max(0, progressData.progress?.total || 0)
        }
      }
    }));
  }, []);

  /**
   * Update state to reflect transition to a step
   *
   * Handles both forward progression and retry (backward) scenarios.
   * When moving forward, marks previous steps as complete.
   * When retrying, resets steps between current and target position.
   *
   * @param {string} backendStep Backend step ID to transition to
   */
  const updateFromStep = (0,external_wp_element_namespaceObject.useCallback)(backendStep => {
    // Use setSteps callback to access current steps state without dependency issues
    setSteps(prevSteps => {
      // Find step by backend name
      const step = prevSteps.find(s => s.id === backendStep);
      if (!step) {
        return prevSteps; // No change
      }

      // Get step index
      const stepIndex = prevSteps.findIndex(s => s.id === step.id);
      if (stepIndex === -1) {
        return prevSteps; // No change
      }

      // Update steps based on progression direction
      const newSteps = prevSteps.map((s, i) => {
        // Mark previous steps as complete
        if (i < stepIndex && s.status !== 'complete') {
          return {
            ...s,
            status: 'complete'
          };
        }
        // Mark target step as active
        if (i === stepIndex) {
          return {
            ...s,
            status: 'active'
          };
        }
        return s;
      });
      return newSteps;
    });
  }, [] // No dependencies - uses setSteps callback to access current state
  );

  /**
   * Add message to activity log history
   *
   * @param {string}      message  Message text (can include HTML)
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const addMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type = 'info', key = null, progress = undefined, metadata = undefined) => {
    setMessageHistory(prev => [{
      id: Date.now() + Math.random(),
      message,
      type,
      key,
      ...(progress !== undefined && {
        progress
      }),
      // Only include progress if provided
      ...(metadata !== undefined && {
        metadata
      }),
      timestamp: Date.now()
    }, ...prev // Prepend to show newest first
    ]);
  }, []);

  /**
   * Update existing message by key
   *
   * Finds a message with the given key and updates its message text, type, and/or progress.
   * If no message with the key exists, does nothing.
   *
   * @param {string}      key        Message key to find
   * @param {string|null} newMessage New message text (optional, keeps existing if null)
   * @param {string|null} newType    New message type (optional, keeps existing if null)
   * @param {Object|null} progress   Progress data { percent, loaded, total } (optional)
   * @param {Object}      metadata   Optional metadata to merge (e.g., provider info)
   */
  const updateMessage = (0,external_wp_element_namespaceObject.useCallback)((key, newMessage = null, newType = null, progress = undefined, metadata = undefined) => {
    setMessageHistory(prev => prev.map(item => {
      if (item.key !== key) {
        return item;
      }
      const updated = {
        ...item
      };
      if (newMessage !== null) {
        updated.message = newMessage;
      }
      if (newType !== null) {
        updated.type = newType;
      }
      // If progress is explicitly null, remove it. If undefined, don't update.
      if (progress === null) {
        delete updated.progress;
      } else if (progress !== undefined) {
        updated.progress = progress;
      }
      // Merge metadata - allow updating specific fields
      if (metadata !== undefined) {
        updated.metadata = {
          ...(item.metadata || {}),
          ...metadata
        };
      }
      return updated;
    }));
  }, []);

  /**
   * Remove message by key
   *
   * Removes a message with the given key from history.
   *
   * @param {string} key Message key to remove
   */
  const removeMessage = (0,external_wp_element_namespaceObject.useCallback)(key => {
    setMessageHistory(prev => prev.filter(item => item.key !== key));
  }, []);

  /**
   * Mark all steps as complete
   *
   * Called when export workflow completes successfully.
   *
   * @param {Object} status Final status object (includes deployment URL, etc.)
   */
  const markAllComplete = (0,external_wp_element_namespaceObject.useCallback)((status = {}) => {
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      status: 'complete'
    })));
    setFinalStatus(status);
    setIsExporting(false);
    addMessage('Site exported successfully!', 'success');
  }, [addMessage]);

  /**
   * Show error message and optionally mark step as failed
   *
   * @param {string}      errorMessage Error message to display
   * @param {string|null} stepId       Step ID to mark as failed (optional)
   */
  const showError = (0,external_wp_element_namespaceObject.useCallback)((errorMessage, stepId = null) => {
    setError(errorMessage);
    setIsExporting(false);
    addMessage(errorMessage, 'error');
    if (stepId) {
      setStepStatus(stepId, 'error', errorMessage);
    }
  }, [addMessage, setStepStatus]);

  /**
   * Set current status message
   *
   * Also adds the message to activity log history.
   * If a key is provided and a message with that key exists, updates it instead of adding new.
   *
   * @param {string}      message  Status message to display
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const setStatusMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type, key = null, progress = undefined, metadata = undefined) => {
    setCurrentStatusMessage(message);
    if (message) {
      if (key) {
        // Check if message with this key already exists
        setMessageHistory(prev => {
          const existingIndex = prev.findIndex(item => item.key === key);
          if (existingIndex !== -1) {
            // Update existing message
            return prev.map((item, index) => {
              if (index !== existingIndex) {
                return item;
              }
              const updated = {
                ...item,
                message,
                type
              };
              // If progress is explicitly null, remove it. If undefined, don't update.
              if (progress === null) {
                delete updated.progress;
              } else if (progress !== undefined) {
                updated.progress = progress;
              }
              // Merge metadata - allow updating specific fields
              if (metadata !== undefined) {
                updated.metadata = {
                  ...(item.metadata || {}),
                  ...metadata
                };
              }
              return updated;
            });
          }
          // Add new message with key
          return [{
            id: Date.now() + Math.random(),
            message,
            type,
            key,
            ...(progress !== undefined && {
              progress
            }),
            ...(metadata !== undefined && {
              metadata
            }),
            timestamp: Date.now()
          }, ...prev];
        });
      } else {
        // No key, just add message
        addMessage(message, type, null, progress, metadata);
      }
    }
  }, [addMessage]);

  /**
   * Set overall progress percentage
   *
   * Progress is monotonic - it never decreases.
   * This prevents progress bar from jumping backwards.
   *
   * @param {number} progress Overall progress percentage (0-100)
   */
  const setOverallProgressValue = (0,external_wp_element_namespaceObject.useCallback)(progress => {
    const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    // Ensure progress never goes backwards
    if (roundedProgress > maxProgressRef.current) {
      maxProgressRef.current = roundedProgress;
    }
    setOverallProgress(maxProgressRef.current);
  }, []);

  /**
   * Set provider arrays
   *
   * @param {Array} staticProviders    Array of provider IDs for static site deployment
   * @param {Array} blueprintProviders Array of provider IDs for blueprint bundle deployment
   */
  const setProviders = (0,external_wp_element_namespaceObject.useCallback)((staticProviders = [], blueprintProviders = []) => {
    setStaticSiteProviders(staticProviders);
    setBlueprintBundleProviders(blueprintProviders);
  }, []);

  /**
   * Set provider instances
   *
   * @param {Array<Object>} instances Array of provider instance objects with { id, label, config }
   */
  const setProviderInstances = (0,external_wp_element_namespaceObject.useCallback)((instances = []) => {
    setProviderInstancesState(instances);
  }, []);

  /**
   * Reset all export state to initial values
   *
   * Called when starting a new export or closing the export modal.
   *
   * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
   */
  const reset = (0,external_wp_element_namespaceObject.useCallback)((keepSteps = false) => {
    if (!keepSteps) {
      setSteps([]);
    }
    setIsExporting(false);
    setFinalStatus(null);
    setError(null);
    setCurrentStatusMessage(null);
    setOverallProgress(0);
    setMessageHistory([]);
    setStaticSiteProviders([]);
    setBlueprintBundleProviders([]);
    setProviderProgressState({});
    setProviderInstancesState([]);
    maxProgressRef.current = 0;
  }, []);

  // Provide context value
  const value = (0,external_wp_element_namespaceObject.useMemo)(() => ({
    steps,
    isExporting,
    finalStatus,
    error,
    currentStatusMessage,
    overallProgress,
    messageHistory,
    staticSiteProviders,
    blueprintBundleProviders,
    providerProgress,
    providerInstances,
    initializeSteps,
    setStepStatus,
    setStepProgress,
    setProviderProgress,
    setProviderInstances,
    updateFromStep,
    markAllComplete,
    showError,
    setIsExporting,
    setStatusMessage,
    setOverallProgressValue,
    addMessage,
    updateMessage,
    removeMessage,
    setProviders,
    reset
  }), [steps, isExporting, finalStatus, error, currentStatusMessage, overallProgress, messageHistory, staticSiteProviders, blueprintBundleProviders, providerProgress, providerInstances, initializeSteps, setStepStatus, setStepProgress, setProviderProgress, setProviderInstances, updateFromStep, markAllComplete, showError, setStatusMessage, setOverallProgressValue, addMessage, updateMessage, removeMessage, setProviders, reset]);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportContext.Provider, {
    value: value,
    children: children
  });
}
;// ./assets/src/hooks/useExportContext.js
/**
 * useExportContext Hook
 *
 * Hook to consume the ExportContext.
 * Provides access to global export workflow state and operations.
 *
 */




/**
 * Hook to access export context
 *
 * Must be used within an ExportProvider.
 *
 * @throws {Error} If used outside ExportProvider
 * @return {Object} Export context value
 * @property {Array}    steps                   - All workflow steps
 * @property {boolean}  isExporting             - Exporting flag
 * @property {Object}   finalStatus             - Final status object (null if not complete)
 * @property {string}   error                   - Error message (null if no error)
 * @property {string}   currentStatusMessage    - Current status message
 * @property {number}   overallProgress         - Overall progress percentage (0-100)
 * @property {Function} initializeSteps         - Initialize steps from definitions
 * @property {Function} setStepStatus           - Set status for a specific step
 * @property {Function} setStepProgress         - Set progress for a specific step
 * @property {Function} updateFromStep          - Transition to a step
 * @property {Function} markAllComplete         - Mark all steps complete
 * @property {Function} showError               - Show error message
 * @property {Function} setIsExporting          - Set exporting flag
 * @property {Function} setStatusMessage        - Set status message
 * @property {Function} setOverallProgressValue - Set overall progress
 * @property {Function} addMessage              - Add a message to history
 * @property {Function} updateMessage           - Update existing message by key
 * @property {Function} removeMessage           - Remove message by key
 * @property {Function} reset                   - Reset all state
 *
 * @example
 * function ExportButton() {
 *     const { isExporting, startExport } = useExportContext();
 *
 *     return (
 *         <button onClick={startExport} disabled={isExporting}>
 *             {isExporting ? 'Exporting...' : 'Export'}
 *         </button>
 *     );
 * }
 *
 * @example
 * // Get steps for display
 * function ProgressSteps() {
 *     const { steps } = useExportContext();
 *
 *     return (
 *         <ul>
 *             {steps.map(step => (
 *                 <li key={step.id}>
 *                     {step.label} - {step.status}
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * }
 *
 * @example
 * // Update step progress
 * function useWorkflowStep() {
 *     const { setStepProgress, updateFromStep } = useExportContext();
 *
 *     const runStep = async (stepId) => {
 *         updateFromStep(stepId);
 *         setStepProgress(stepId, 50);
 *         await doWork();
 *         setStepProgress(stepId, 100);
 *     };
 *
 *     return { runStep };
 * }
 */
function useExportContext() {
  const context = (0,external_wp_element_namespaceObject.useContext)(ExportContext);
  if (!context) {
    throw new Error('useExportContext must be used within an ExportProvider');
  }
  return context;
}
/* harmony default export */ const hooks_useExportContext = ((/* unused pure expression or super */ null && (useExportContext)));
;// ./assets/src/export/hooks/useExportState.js
/**
 * Publish State Hook
 *
 * Wrapper hook that provides export state from ExportContext.
 * Delegates to centralized state management.
 *
 */



/**
 * Get export workflow state
 *
 * Returns all export state and operations from context.
 * Simplified from 202 lines to delegate to ExportContext.
 *
 * @return {Object} Publish state and operations
 */
function useExportState() {
  return useExportContext();
}
// EXTERNAL MODULE: ./assets/src/utils/api.js
var utils_api = __webpack_require__(444);
;// ./node_modules/idb/build/index.js
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));



;// ./assets/src/utils/indexedDB.js
/**
 * IndexedDB Wrapper - Abstract storage interface for browser persistent storage
 *
 * Uses the `idb` library (by Jake Archibald) as a foundation, providing a
 * simple, promise-based API for storing data in IndexedDB.
 *
 * Works in all modern browsers including WordPress Playground WASM environment.
 *
 * Features:
 * - Simple key-value storage interface
 * - Automatic database initialization
 * - Promise-based async API
 * - Error handling and quota management
 * - Support for multiple stores and indexes
 * - Automatic cleanup of expired data
 * - Built on battle-tested `idb` library (9.8M weekly downloads)
 */

/* global indexedDB, IDBKeyRange */



/**
 * IndexedDB database instance cache
 * Stores opened database connections to avoid repeated initialization
 */
const dbInstances = new Map();

/**
 * Default database configuration
 */
const DEFAULT_CONFIG = {
  dbName: 'aether-site-exporter',
  version: 1,
  stores: {
    cache: {
      keyPath: 'key',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Open IndexedDB database with configuration using idb library
 *
 * @param {Object} config         - Database configuration
 * @param {string} config.dbName  - Database name
 * @param {number} config.version - Database version
 * @param {Object} config.stores  - Object stores configuration
 * @return {Promise<Object>} Database instance
 */
async function openDatabase(config = DEFAULT_CONFIG) {
  const cacheKey = `${config.dbName}_v${config.version}`;

  // Return cached instance if available
  if (dbInstances.has(cacheKey)) {
    return dbInstances.get(cacheKey);
  }
  try {
    const db = await openDB(config.dbName, config.version, {
      upgrade(database) {
        // Create object stores based on configuration
        Object.entries(config.stores).forEach(([storeName, storeConfig]) => {
          // Delete existing store if it exists (for upgrades)
          if (database.objectStoreNames.contains(storeName)) {
            database.deleteObjectStore(storeName);
          }

          // Create new store
          const store = database.createObjectStore(storeName, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });

          // Create indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              });
            });
          }
        });
      }
    });
    dbInstances.set(cacheKey, db);
    return db;
  } catch (error) {
    throw new Error(`Failed to open IndexedDB: ${error.message || 'Unknown error'}`);
  }
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 *
 * Provides a simple key-value API on top of idb library
 */
class IndexedDBStore {
  /**
   * Constructor
   *
   * @param {string} storeName - Name of the object store
   * @param {Object} config    - Database configuration (optional)
   */
  constructor(storeName, config = DEFAULT_CONFIG) {
    this.storeName = storeName;
    this.config = config;
    this.db = null;
    // Get the keyPath for this store from config
    this.keyPath = config.stores?.[storeName]?.keyPath || DEFAULT_CONFIG.stores.cache.keyPath;
  }

  /**
   * Ensure database is initialized
   *
   * @return {Promise<Object>} Database instance
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await openDatabase(this.config);
    }
    return this.db;
  }

  /**
   * Get a value by key
   *
   * @param {string|number} key - The key to retrieve
   * @return {Promise<any|null>} The stored value or null if not found
   */
  async get(key) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.get(this.storeName, key);
      return result || null;
    } catch (error) {
      console.error(`[IndexedDB] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get all values from the store
   *
   * @param {number} limit - Maximum number of items to return (optional)
   * @return {Promise<Array>} Array of all stored values
   */
  async getAll(limit = undefined) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAll(this.storeName, undefined, limit);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all values:', error);
      return [];
    }
  }

  /**
   * Get all keys from the store
   *
   * @return {Promise<Array>} Array of all keys
   */
  async getAllKeys() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllKeys(this.storeName);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Set a value by key
   *
   * @param {string|number} key      - The key to set
   * @param {any}           value    - The value to store
   * @param {Object}        metadata - Additional metadata (optional)
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async set(key, value, metadata = {}) {
    try {
      const db = await this.ensureDatabase();

      // For object values, spread properties; for primitives, use value property
      const valueData = typeof value === 'object' && value !== null ? {
        ...value
      } : {
        value
      };
      const data = {
        [this.keyPath]: key,
        ...valueData,
        timestamp: Date.now(),
        ...metadata
      };
      await db.put(this.storeName, data);
      return true;
    } catch (error) {
      // Check for quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        console.warn('[IndexedDB] Storage quota exceeded. Consider cleaning up old data.');
      }
      console.error(`[IndexedDB] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a value by key
   *
   * @param {string|number} key - The key to delete
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async delete(key) {
    try {
      const db = await this.ensureDatabase();
      await db.delete(this.storeName, key);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Error deleting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data from the store
   *
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async clear() {
    try {
      const db = await this.ensureDatabase();
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Error clearing store:', error);
      return false;
    }
  }

  /**
   * Count number of items in the store
   *
   * @return {Promise<number>} Number of items
   */
  async count() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.count(this.storeName);
      return result || 0;
    } catch (error) {
      console.error('[IndexedDB] Error counting items:', error);
      return 0;
    }
  }

  /**
   * Get values by index
   *
   * @param {string} indexName  - Name of the index
   * @param {any}    indexValue - Value to search for in the index
   * @return {Promise<Array>} Array of matching values
   */
  async getByIndex(indexName, indexValue) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllFromIndex(this.storeName, indexName, indexValue);
      return result || [];
    } catch (error) {
      console.error(`[IndexedDB] Error getting by index "${indexName}":`, error);
      return [];
    }
  }

  /**
   * Delete items older than specified age
   *
   * Uses the timestamp index to efficiently find and delete old items.
   *
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @return {Promise<number>} Number of items deleted
   */
  async deleteOlderThan(maxAgeMs) {
    try {
      const db = await this.ensureDatabase();
      const cutoffTime = Date.now() - maxAgeMs;

      // Use transaction for atomic delete operation
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('timestamp');
      let deletedCount = 0;

      // Get cursor for items with timestamp <= cutoffTime
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      while (cursor) {
        await cursor.delete();
        deletedCount++;
        cursor = await cursor.continue();
      }
      await tx.done;
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Error deleting old items:', error);
      return 0;
    }
  }

  /**
   * Get storage estimate (quota and usage)
   *
   * @return {Promise<Object>} Storage estimate with quota and usage
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          percentUsed: estimate.quota > 0 ? estimate.usage / estimate.quota * 100 : 0
        };
      } catch (error) {
        console.error('[IndexedDB] Error getting storage estimate:', error);
      }
    }
    return {
      quota: null,
      usage: null,
      percentUsed: null
    };
  }
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof openDB === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
async function deleteDatabase(dbName) {
  try {
    // Remove from cache
    const cacheKeys = Array.from(dbInstances.keys()).filter(key => key.startsWith(dbName));
    cacheKeys.forEach(key => dbInstances.delete(key));

    // Delete database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message || 'Unknown error'}`));
    });
    return true;
  } catch (error) {
    console.error('[IndexedDB] Error deleting database:', error);
    return false;
  }
}
/* harmony default export */ const utils_indexedDB = (IndexedDBStore);
;// ./assets/src/utils/wporgCache.js
/**
 * WordPress.org API Cache - Persistent cache for WordPress.org existence checks
 *
 * Caches WordPress.org plugin/theme existence checks in IndexedDB with 7-day expiration.
 * Provides 3-15 second performance improvement per export by eliminating redundant API calls.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 7-day cache expiration
 * - In-memory L1 cache for current session
 * - Automatic cleanup of expired entries
 * - Works in WordPress Playground WASM environment
 */



/**
 * Cache configuration
 */
const WPORG_CACHE_CONFIG = {
  dbName: 'aether-wporg-cache',
  version: 1,
  stores: {
    wporgChecks: {
      keyPath: 'cacheKey',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Cache expiration time (7 days)
 * WordPress.org plugins/themes don't change frequently, so 7 days is safe
 */
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * WordPress.org Cache Manager
 *
 * Provides persistent caching of WordPress.org existence checks
 */
class WpOrgCache {
  /**
   * Constructor
   */
  constructor() {
    this.store = new utils_indexedDB('wporgChecks', WPORG_CACHE_CONFIG);
    this.memoryCache = new Map(); // L1 cache for current session
    this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
  }

  /**
   * Generate cache key
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {string} Cache key
   */
  getCacheKey(slug, type) {
    return `${type}:${slug}`;
  }

  /**
   * Get cached existence check result
   *
   * Checks memory cache first, then IndexedDB
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {Promise<boolean|null>} Cached result or null if not found/expired
   */
  async get(slug, type) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Check memory cache first (instant)
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // L2: Check IndexedDB
    try {
      const cached = await this.store.get(cacheKey);

      // Check if cache entry exists and is not expired
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRATION_MS) {
          // Valid cache hit - store in memory for faster access
          this.memoryCache.set(cacheKey, cached.exists);
          return cached.exists;
        }

        // Cache expired - delete it
        await this.store.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[WpOrgCache] Error getting cache for ${cacheKey}:`, error);
    }
    return null; // Cache miss or error
  }

  /**
   * Set cached existence check result
   *
   * Stores in both memory and IndexedDB
   *
   * @param {string}  slug   - Plugin/theme slug
   * @param {string}  type   - 'plugin' or 'theme'
   * @param {boolean} exists - Whether the asset exists on WordPress.org
   * @return {Promise<boolean>} True if successfully cached
   */
  async set(slug, type, exists) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Store in memory
    this.memoryCache.set(cacheKey, exists);

    // L2: Store in IndexedDB
    try {
      await this.store.set(cacheKey, {
        exists
      }, {
        type,
        slug
      });
      return true;
    } catch (error) {
      console.error(`[WpOrgCache] Error setting cache for ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   *
   * Runs automatically on initialization, removes entries older than 7 days
   *
   * @return {Promise<number>} Number of entries cleaned up
   */
  async cleanup() {
    // Prevent concurrent cleanup runs
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = (async () => {
      try {
        const deleted = await this.store.deleteOlderThan(CACHE_EXPIRATION_MS);

        // Cleaned up expired cache entries

        return deleted;
      } catch (error) {
        return 0;
      } finally {
        this.cleanupPromise = null;
      }
    })();
    return this.cleanupPromise;
  }

  /**
   * Clear all cached data
   *
   * @return {Promise<boolean>} True if successful
   */
  async clear() {
    this.memoryCache.clear();
    return this.store.clear();
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const totalCount = await this.store.count();
      const memoryCount = this.memoryCache.size;
      return {
        totalCached: totalCount,
        memoryCached: memoryCount,
        hitRate: null // Would require tracking hits/misses
      };
    } catch (error) {
      console.error('[WpOrgCache] Error getting stats:', error);
      return {
        totalCached: 0,
        memoryCached: this.memoryCache.size,
        hitRate: null
      };
    }
  }
}

// Create singleton instance
let cacheInstance = null;

/**
 * Get WordPress.org cache instance (singleton)
 *
 * @return {WpOrgCache} Cache instance
 */
function getWpOrgCache() {
  if (!cacheInstance) {
    cacheInstance = new WpOrgCache();

    // Run cleanup on first initialization
    cacheInstance.cleanup().catch(error => {
      console.error('[WpOrgCache] Initial cleanup failed:', error);
    });
  }
  return cacheInstance;
}
/* harmony default export */ const wporgCache = ((/* unused pure expression or super */ null && (getWpOrgCache)));
;// ./assets/src/services/AssetDiscoveryService.js
/**
 * Asset Discovery Service
 *
 * Pure functions and service class for discovering and categorizing WordPress assets.
 * Extracted from useAssetDiscovery hook for better testability.
 *
 */

/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
function normalizePluginSlug(slug) {
  if (slug.includes('/')) {
    return slug.split('/')[0];
  }
  return slug;
}

/**
 * Filter assets to only active ones.
 *
 * @param {Array<Object>} assets Array of asset objects with is_active property.
 * @return {Array<Object>} Only active assets.
 */
function filterActiveAssets(assets) {
  return assets.filter(asset => asset.is_active);
}

/**
 * Get active theme from themes array.
 *
 * @param {Array<Object>} themes Array of theme objects.
 * @return {Object|null} Active theme or null if none found.
 */
function getActiveTheme(themes) {
  return themes.find(theme => theme.is_active) || null;
}

/**
 * Filter assets by WordPress.org status.
 *
 * @param {Array<Object>} assets    Array of assets with from_wporg property.
 * @param {boolean}       fromWpOrg True to get WordPress.org assets, false for custom.
 * @return {Array<Object>} Filtered assets.
 */
function filterByWpOrgStatus(assets, fromWpOrg) {
  return assets.filter(asset => asset.from_wporg === fromWpOrg);
}

/**
 * Filter out built-in Playground plugins.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @return {Array<Object>} Plugins excluding built-in ones.
 */
function filterBuiltInPlugins(plugins) {
  const builtInSlugs = ['aether', 'sqlite-database-integration'];
  return plugins.filter(plugin => !builtInSlugs.includes(normalizePluginSlug(plugin.slug)));
}

/**
 * Transform asset to custom asset format.
 *
 * @param {Object} asset Asset object with assetType, slug, name, version.
 * @return {Object} Custom asset format.
 */
function toCustomAssetFormat(asset) {
  return {
    type: asset.assetType,
    slug: asset.slug,
    name: asset.name,
    version: asset.version
  };
}

/**
 * Transform asset to blueprint slug format.
 *
 * @param {Object} asset Asset object with slug.
 * @return {string} Normalized slug.
 */
function toBlueprintSlugFormat(asset) {
  return normalizePluginSlug(asset.slug);
}

/**
 * Combine plugins and themes with asset type tag.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @param {Array<Object>} themes  Array of theme objects.
 * @return {Array<Object>} Combined array with assetType property.
 */
function combineAssetsWithType(plugins, themes) {
  return [...plugins.map(p => ({
    ...p,
    assetType: 'plugin'
  })), ...themes.map(t => ({
    ...t,
    assetType: 'theme'
  }))];
}

/**
 * Get site name from globals.
 * Separated as pure function for testability.
 *
 * @return {string} Site name from window.wp.siteName or document.title or empty string.
 */
function getSiteName() {
  if (typeof window !== 'undefined' && window.wp && window.wp.siteName) {
    return window.wp.siteName;
  }
  if (typeof document !== 'undefined' && document.title) {
    return document.title;
  }
  return '';
}

/**
 * Asset Discovery Service
 *
 * Service class for discovering and categorizing WordPress assets.
 * Uses dependency injection for testability.
 */
class AssetDiscoveryService {
  /**
   * @param {Function} apiFetch      WordPress apiFetch function.
   * @param {Function} checkWpOrg    Function to check if asset is from WordPress.org.
   * @param {Object}   wporgCache    WordPress.org cache instance.
   * @param {Function} getSiteNameFn Function to get site name (optional, defaults to getSiteName).
   */
  constructor(apiFetch, checkWpOrg, wporgCache, getSiteNameFn = null) {
    this.apiFetch = apiFetch;
    this.checkWpOrg = checkWpOrg;
    this.wporgCache = wporgCache;
    this.getSiteName = getSiteNameFn || getSiteName;
  }

  /**
   * Get all installed plugins and themes with metadata from REST API.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getInstalledAssets() {
    try {
      const response = await this.apiFetch({
        path: '/aether/site-exporter/assets',
        method: 'GET'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assets');
      }
      return {
        plugins: response.plugins || [],
        themes: response.themes || []
      };
    } catch (error) {
      return {
        plugins: [],
        themes: []
      };
    }
  }

  /**
   * Get plugin configuration from window.aetherData.
   *
   * Configuration was previously fetched from REST API endpoint /config,
   * but that endpoint was removed in favor of reading from window.aetherData
   * which is injected by PHP.
   *
   * @return {Promise<Object>} Configuration object.
   */
  async getConfig() {
    // Read config from window.aetherData (injected by PHP).
    if (typeof window !== 'undefined' && window.aetherData) {
      return {
        publicUrl: window.aetherData.publicUrl || '',
        adminUrl: window.aetherData.adminUrl || ''
        // Note: wporgCheckMethod and corsProxyUrl are not needed
        // because the JS code uses hardcoded defaults ('cors-proxy' with fallback to 'direct')
      };
    }

    // Fallback if window.aetherData is not available.
    return {
      publicUrl: '',
      adminUrl: ''
    };
  }

  /**
   * Check all assets against WordPress.org in parallel.
   *
   * @param {Array<Object>} items  Array of items with slug and assetType.
   * @param {Object}        config Configuration object for WordPress.org check.
   * @return {Promise<Array<Object>>} Assets with from_wporg property added.
   */
  async checkAssetsAgainstWpOrg(items, config) {
    return Promise.all(items.map(async item => {
      const fromWpOrg = await this.checkWpOrg(item.slug, item.assetType, config);
      return {
        ...item,
        from_wporg: fromWpOrg
      };
    }));
  }

  /**
   * Discover all custom assets (not from WordPress.org).
   *
   * @return {Promise<Array<Object>>} Array of custom assets.
   */
  async discoverCustomAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const customAssets = filterByWpOrgStatus(allAssets, false);
    return customAssets.map(toCustomAssetFormat);
  }

  /**
   * Get WordPress.org assets for blueprint generation.
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getBlueprintAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const wporgAssets = filterByWpOrgStatus(allAssets, true);
    const wporgPlugins = wporgAssets.filter(asset => asset.assetType === 'plugin').filter(plugin => filterBuiltInPlugins([plugin]).length > 0).map(toBlueprintSlugFormat);
    const wporgThemes = wporgAssets.filter(asset => asset.assetType === 'theme').map(toBlueprintSlugFormat);
    return {
      plugins: wporgPlugins,
      themes: wporgThemes,
      siteName: this.getSiteName()
    };
  }
}
;// ./assets/src/utils/useAssetDiscovery.js
/**
 * Asset Discovery Hook
 *
 * Browser-based implementation for WordPress.org asset detection.
 * Detects WordPress.org plugins/themes by checking wordpress.org APIs.
 *
 */







// Re-export normalizePluginSlug


/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses browser-based method (default: CORS proxy) to check WordPress.org.
 * Can be switched to direct API calls via config.
 *
 * @param {string} slug   - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type   - 'plugin' or 'theme'
 * @param {Object} config - Configuration object with wporgCheckMethod and corsProxyUrl
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
async function isFromWordPressOrg(slug, type, config = {}) {
  // Normalize plugin slugs (remove file path if present)
  // Example: 'akismet/akismet.php' -> 'akismet'
  const normalizedSlug = type === 'plugin' ? normalizePluginSlug(slug) : slug;

  // Check persistent cache first (IndexedDB + memory)
  const cache = getWpOrgCache();
  const cached = await cache.get(normalizedSlug, type);
  if (cached !== null) {
    return cached;
  }

  // Try CORS proxy method first, then fallback to direct API calls
  let result = await checkWithMethod(normalizedSlug, type, 'cors-proxy', config);

  // If CORS proxy method returned null (unable to check), try direct API fallback
  if (result === null) {
    result = await checkWithMethod(normalizedSlug, type, 'direct', config);
  }

  // If still null after fallback, treat as false
  if (result === null) {
    result = false;
  }

  // Cache the result (only if we got a definitive answer)
  if (result !== null) {
    await cache.set(normalizedSlug, type, result);
  }
  return result;
}

/**
 * Check WordPress.org using specific method
 *
 * @param {string} slug   - Normalized plugin/theme slug
 * @param {string} type   - 'plugin' or 'theme'
 * @param {string} method - 'cors-proxy' or 'direct'
 * @param {Object} config - Configuration object
 * @return {Promise<boolean|null>} True if exists, false if doesn't exist, null if unable to check
 */
async function checkWithMethod(slug, type, method, config = {}) {
  try {
    let checkUrl;
    switch (method) {
      case 'cors-proxy':
        // Use external CORS proxy (e.g., cfp.s12y.org or custom worker)
        checkUrl = config.corsProxyUrl || 'https://cfp.s12y.org/check-wporg';
        checkUrl += `?slug=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
        break;
      case 'direct':
      default:
        // Direct WordPress.org API calls (may fail in some browsers due to CORS)
        if (type === 'theme') {
          checkUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${encodeURIComponent(slug)}`;
        } else {
          checkUrl = `https://api.wordpress.org/plugins/info/1.0/${encodeURIComponent(slug)}.json`;
        }
        break;
    }

    // Use plain fetch for all methods (browser-based checking)
    const response = await fetch(checkUrl);
    if (!response.ok) {
      throw new Error(`WordPress.org check returned ${response.status}`);
    }
    const data = await response.json();

    // Handle different response formats
    let exists;
    if (method === 'direct') {
      // Direct WordPress.org API: check for 'error' field
      exists = !data.error && (data.slug || data.name);
    } else {
      // CORS proxy: standardized response with 'success' and 'exists' fields
      if (!data.success) {
        throw new Error(data.error || (0,external_wp_i18n_namespaceObject.__)('Unknown error', 'aether-site-exporter'));
      }
      exists = data.exists;
    }

    // Return the result (could be true, false, or null)
    // null means "unable to check" and should trigger fallback
    return exists;
  } catch (error) {
    // Network/API error - return null to indicate unable to check
    return null;
  }
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 * Uses AssetDiscoveryService for business logic.
 *
 * @return {Object} Hook methods and state
 */
function useAssetDiscovery() {
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  // Create service instance with dependencies
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new AssetDiscoveryService(utils_api/* default */.Ay, isFromWordPressOrg, getWpOrgCache()), []);

  /**
   * Discover all custom assets (not from WordPress.org)
   *
   * @return {Promise<Array<Object>>} Array of custom assets
   */
  const discoverCustomAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const customAssets = await service.discoverCustomAssets();
      setLoading(false);
      return customAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);

  /**
   * Get WordPress.org assets for blueprint generation
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays
   */
  const getBlueprintAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const blueprintAssets = await service.getBlueprintAssets();
      setLoading(false);
      return blueprintAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);
  return {
    discoverCustomAssets,
    getBlueprintAssets,
    loading,
    error
  };
}
;// ./assets/src/utils/storage.js
/**
 * Storage Abstraction Layer
 *
 * Provides a testable abstraction over localStorage with:
 * - Automatic JSON serialization/deserialization
 * - Error handling for quota exceeded and other errors
 * - Consistent API that can be easily mocked in tests
 * - Support for default values
 *
 */

/**
 * Storage abstraction object.
 *
 * @type {Object}
 */
const storage = {
  /**
   * Get a value from storage.
   *
   * @param {string} key          Storage key.
   * @param {*}      defaultValue Optional default value if key doesn't exist or parse fails.
   * @return {*} Parsed value, default value, or null.
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If JSON parsing fails, return default value
        return defaultValue;
      }
    } catch (error) {
      // Handle localStorage access errors
      return defaultValue;
    }
  },
  /**
   * Set a value in storage.
   *
   * @param {string} key   Storage key.
   * @param {*}      value Value to store (will be JSON serialized).
   * @return {boolean} True on success, false on error.
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle quota exceeded, circular references, or other errors
      return false;
    }
  },
  /**
   * Remove a value from storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True on success, false on error.
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Clear all storage.
   *
   * @return {boolean} True on success, false on error.
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if a key exists in storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True if key exists, false otherwise.
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  },
  /**
   * Get all keys in storage.
   *
   * @return {Array<string>} Array of storage keys.
   */
  keys() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      return [];
    }
  }
};
;// ./assets/src/constants/api.js
/**
 * API Constants
 *
 * Centralized API endpoints and configuration for WordPress REST API
 *
 */

/**
 * WordPress REST API namespace for Aether plugin
 * @constant {string}
 */
const API_NAMESPACE = 'aether/site-exporter';

/**
 * Base path for all Aether REST API endpoints
 * Note: Does not include /wp-json/ prefix as that's handled by apiFetch root URL middleware
 * @constant {string}
 */
const API_BASE_PATH = `/${API_NAMESPACE}`;

/**
 * REST API Endpoints
 *
 * All WordPress REST API endpoints used throughout the application.
 * Use these constants instead of hardcoded strings.
 */
const ENDPOINTS = {
  /**
   * Settings endpoints
   */
  SETTINGS: `${API_BASE_PATH}/settings`,
  SETTINGS_GET: `${API_BASE_PATH}/settings`,
  SETTINGS_UPDATE: `${API_BASE_PATH}/settings`,
  /**
   * Export workflow endpoints (formerly publish)
   */
  EXPORT_WORKFLOW: {
    START: `${API_BASE_PATH}/export`,
    STATUS: `${API_BASE_PATH}/export/status`,
    STEPS: `${API_BASE_PATH}/export/steps`,
    STEP: stepId => `${API_BASE_PATH}/export/steps/${stepId}`,
    CANCEL: `${API_BASE_PATH}/export/cancel`,
    CREATE_ARCHIVE: `${API_BASE_PATH}/export/createArchive`,
    GENERATE_BLUEPRINT_BUNDLE: `${API_BASE_PATH}/export/generateBlueprintBundle`
  },
  /**
   * Provider endpoints
   */
  PROVIDERS: {
    CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    SAVE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    DELETE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    STATUS: providerId => `${API_BASE_PATH}/providers/${providerId}/status`
  },
  /**
   * Blueprint endpoints
   * Note: Blueprint generation is now handled client-side via useBlueprintGenerator hook
   */
  BLUEPRINT: {
    GET: `${API_BASE_PATH}/blueprint`
  },
  /**
   * Export endpoints
   */
  EXPORT: {
    START: `${API_BASE_PATH}/export/start`,
    STATUS: `${API_BASE_PATH}/export/status`,
    DOWNLOAD: `${API_BASE_PATH}/export/download`
  },
  /**
   * Configuration endpoints
   */
  CONFIG: {
    UPDATE: `${API_BASE_PATH}/config`,
    RESET: `${API_BASE_PATH}/config/reset`
  },
  /**
   * Static site endpoints
   */
  STATIC_SITE: {
    URLS: `${API_BASE_PATH}/static-site/urls`,
    GENERATE: `${API_BASE_PATH}/static-site/generate`
  },
  /**
   * URL Discovery endpoint
   * Consolidated endpoint for discovering all URLs (posts, terms, authors, archives, pagination)
   */
  URL_DISCOVERY: {
    DISCOVER: `${API_BASE_PATH}/urls/discover`
  },
  /**
   * Asset management endpoints
   * Note: Asset discovery now handled by useAssetDiscovery.js hook (browser-based)
   * These endpoints have been removed as they made HTTP requests that fail in WordPress Playground
   */
  ASSETS: {
    EXTRACT: `${API_BASE_PATH}/assets/extract`
  },
  /**
   * Usage statistics endpoints
   */
  USAGE: {
    SUMMARY: `${API_BASE_PATH}/usage/summary`,
    DETAILS: `${API_BASE_PATH}/usage/details`
  }
};

/**
 * HTTP Methods
 * @constant {Object}
 */
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

/**
 * API Request Headers
 * @constant {Object}
 */
const API_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded'
};

/**
 * API Response Status Codes
 * @constant {Object}
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
;// ./assets/src/constants/index.js
/**
 * Constants Index
 *
 * Central export point for all application constants.
 * Import from this file for convenience:
 *
 * @example
 * import { ENDPOINTS, POLLING_INTERVAL } from '../constants';
 */

// API Constants


// Timing Constants

;// ./assets/src/services/ExportAPIService.js
/**
 * Publish API Service
 *
 * Service for export-related API operations.
 * Extracted from useExportAPI hook for testability.
 *
 */


const CHANGED_ASSETS_KEY = 'aether_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles export-related API calls and asset tracking.
 */
class ExportAPIService {
  /**
   * Create service instance
   *
   * @param {Function} apiFetch       WordPress apiFetch function (injectable for testing)
   * @param {Object}   assetDiscovery Asset discovery service
   * @param {Object}   storage        Storage implementation (injectable for testing)
   */
  constructor(apiFetch, assetDiscovery, storage) {
    this.apiFetch = apiFetch;
    this.assetDiscovery = assetDiscovery;
    this.storage = storage;
  }

  /**
   * Discover custom assets
   *
   * Uses browser-based asset discovery instead of PHP endpoint.
   * This avoids HTTP requests that fail in WordPress Playground.
   *
   * @return {Promise<Object>} Discovery response with assets array
   */
  async discoverBlueprintBundleAssets() {
    const customAssets = await this.assetDiscovery.discoverCustomAssets();
    return {
      success: true,
      assets: customAssets,
      count: customAssets.length
    };
  }

  /**
   * Mark asset as changed
   *
   * Stores changed assets in localStorage.
   * No server call needed - browser-only tracking.
   *
   * @param {string} type Asset type (theme, plugin)
   * @param {string} slug Asset slug
   * @return {Object} Success response
   */
  markAssetChanged(type, slug) {
    // Get current changed assets
    const changedAssets = this.storage.get(CHANGED_ASSETS_KEY, []);
    const key = `${type}:${slug}`;

    // Add if not already present
    if (!changedAssets.includes(key)) {
      changedAssets.push(key);
      this.storage.set(CHANGED_ASSETS_KEY, changedAssets);
    }
    return {
      success: true,
      message: `Marked ${type} ${slug} as changed`
    };
  }

  /**
   * Fetch all pages of a paginated URL endpoint.
   *
   * @param {string}   endpoint       API endpoint path.
   * @param {Function} onPageComplete Optional callback after each page.
   * @return {Promise<Array>} All URLs from all pages.
   */
  async fetchAllPaginatedUrls(endpoint, onPageComplete = null) {
    const allUrls = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await this.apiFetch({
        path: `${endpoint}?page=${page}`,
        method: 'GET'
      });
      if (!response.success) {
        throw new Error(response.message || `Failed to fetch URLs from ${endpoint}`);
      }
      allUrls.push(...(response.urls || []));
      hasMore = response.hasMore;
      page = response.nextPage || page + 1;
      if (onPageComplete) {
        onPageComplete({
          page: page - 1,
          urlsCount: allUrls.length,
          total: response.total,
          hasMore
        });
      }
    }
    return allUrls;
  }

  /**
   * Discover URLs for static site generation
   *
   * Calls the consolidated URL discovery endpoint to get all URLs.
   * Includes posts, terms, authors, archives, and pagination URLs.
   *
   * @param {Function} onProgress Optional callback for progress updates.
   * @return {Promise<Object>} Response with urls array and staticSiteUrl
   */
  async discoverUrls(onProgress = null) {
    try {
      const allUrls = [];
      let page = 1;
      let hasMore = true;
      if (onProgress) {
        onProgress({
          status: 'fetching',
          type: 'all'
        });
      }

      // Fetch all URLs from consolidated endpoint
      while (hasMore) {
        const response = await this.apiFetch({
          path: `${ENDPOINTS.URL_DISCOVERY.DISCOVER}?page=${page}`,
          method: 'GET'
        });
        if (!response.success) {
          throw new Error(response.message || 'Failed to discover URLs');
        }
        allUrls.push(...(response.urls || []));
        hasMore = response.hasMore;
        page = response.nextPage || page + 1;
        if (onProgress) {
          onProgress({
            status: 'fetching',
            page: page - 1,
            urlsCount: allUrls.length,
            total: response.total,
            hasMore
          });
        }
      }

      // Deduplicate URLs
      const uniqueUrls = [...new Set(allUrls)];
      if (onProgress) {
        onProgress({
          status: 'complete',
          urlsCount: uniqueUrls.length
        });
      }
      return {
        success: true,
        urls: uniqueUrls,
        staticSiteUrl: null // Will be determined by provider config
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to discover URLs',
        urls: [],
        staticSiteUrl: null
      };
    }
  }

  /**
   * Create site archive
   *
   * Creates wp-content.zip containing custom plugins, themes, and uploads.
   *
   * @param {Object}  options                Archive creation options.
   * @param {Array}   options.assets         Array of asset objects to include.
   * @param {boolean} options.includeUploads Whether to include uploads directory.
   * @return {Promise<Object>} Response with zipPath, zipUrl, and zipSize
   */
  async createArchive({
    assets = [],
    includeUploads = true
  } = {}) {
    try {
      // Extract slugs from assets array
      const customAssets = assets.map(asset => asset.slug || asset);
      const response = await this.apiFetch({
        path: ENDPOINTS.EXPORT_WORKFLOW.CREATE_ARCHIVE,
        method: 'POST',
        data: {
          custom_assets: customAssets,
          include_uploads: includeUploads
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const archiveData = response.data;
        return {
          success: true,
          zipPath: archiveData.zipPath || null,
          zipUrl: archiveData.zipUrl || null,
          zipSize: archiveData.zipSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create archive'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create archive'
      };
    }
  }

  /**
   * Generate blueprint JSON
   *
   * This is typically handled client-side via generateBlueprintJson function.
   * This method is a fallback if the function is not available.
   *
   * @return {Promise<Object>} Response with blueprint data
   */
  async generateBlueprint() {
    // This is a fallback method - typically blueprint generation is done client-side
    // via the generateBlueprintJson function from useBlueprintGenerator hook
    return {
      success: false,
      message: 'Blueprint generation must be done client-side. Please ensure generateBlueprintJson function is available.'
    };
  }

  /**
   * Create blueprint bundle
   *
   * Creates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
   *
   * @param {Object} options                  Bundle creation options.
   * @param {Object} options.blueprint        Blueprint JSON data.
   * @param {string} options.wpContentZipPath Path to wp-content.zip.
   * @return {Promise<Object>} Response with bundlePath, bundleUrl, and bundleSize
   */
  async createBlueprintBundle({
    blueprint,
    wpContentZipPath
  } = {}) {
    try {
      if (!blueprint) {
        return {
          success: false,
          message: 'Blueprint data is required'
        };
      }
      if (!wpContentZipPath) {
        return {
          success: false,
          message: 'Archive path is required'
        };
      }
      const response = await this.apiFetch({
        path: ENDPOINTS.EXPORT_WORKFLOW.GENERATE_BLUEPRINT_BUNDLE,
        method: 'POST',
        data: {
          blueprintData: blueprint,
          archiveResult: {
            zipPath: wpContentZipPath
          }
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const bundleData = response.data;
        return {
          success: true,
          bundlePath: bundleData.bundlePath || null,
          bundleUrl: bundleData.bundleUrl || null,
          bundleSize: bundleData.bundleSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create blueprint bundle'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create blueprint bundle'
      };
    }
  }
}
;// ./assets/src/export/hooks/useExportAPI.js
/**
 * Publish API Hook
 *
 * Handles API calls for export operations.
 * Uses ExportAPIService for all business logic.
 *
 */






function useExportAPI() {
  const assetDiscovery = useAssetDiscovery();

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new ExportAPIService(utils_api/* default */.Ay, assetDiscovery, storage), [assetDiscovery]);
  const discoverBlueprintBundleAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);

  // getAssetStatus is an alias for discoverBlueprintBundleAssets (eliminates duplication)
  const getAssetStatus = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);
  const markAssetChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    return Promise.resolve(service.markAssetChanged(type, slug));
  }, [service]);
  const discoverUrls = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverUrls();
  }, [service]);
  const createArchive = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.createArchive(options);
  }, [service]);
  const generateBlueprint = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.generateBlueprint(options);
  }, [service]);
  const createBlueprintBundle = (0,external_wp_element_namespaceObject.useCallback)(async options => {
    return await service.createBlueprintBundle(options);
  }, [service]);
  return {
    discoverBlueprintBundleAssets,
    getAssetStatus,
    markAssetChanged,
    discoverUrls,
    createArchive,
    generateBlueprint,
    createBlueprintBundle
  };
}
;// ./assets/src/services/AssetManagerService.js
/**
 * Asset Manager Service
 *
 * Service for managing asset state with pure business logic.
 * Extracted from useAssetManager hook for testability.
 *
 */

const STORAGE_KEY = 'aetherAssets';

/**
 * Normalize asset data from server
 *
 * Converts snake_case fields to camelCase and ensures existsOnR2 is present.
 * Pure function for data transformation.
 *
 * @param {Object} assetData Raw asset data from server
 * @return {Object} Normalized asset data
 */
function normalizeAssetData(assetData) {
  if (!assetData || typeof assetData !== 'object') {
    return {
      existsOnR2: false
    };
  }

  // eslint-disable-next-line camelcase
  const {
    exists_on_r2,
    existsOnR2,
    ...rest
  } = assetData;
  return {
    ...rest,
    // eslint-disable-next-line camelcase
    existsOnR2: existsOnR2 || exists_on_r2 || false
  };
}

/**
 * Calculate if asset needs upload
 *
 * Pure function to determine upload necessity based on R2 existence.
 *
 * @param {boolean} existsOnR2 Whether asset exists on R2
 * @return {boolean} Whether asset needs upload
 */
function calculateNeedsUpload(existsOnR2) {
  return !existsOnR2;
}

/**
 * Create new asset object
 *
 * Pure function for creating asset with consistent structure.
 *
 * @param {string}  type       Asset type (theme, plugin)
 * @param {string}  slug       Asset slug
 * @param {string}  name       Asset name (optional)
 * @param {boolean} existsOnR2 Whether asset exists on R2 (optional)
 * @return {Object} New asset object
 */
function createAsset(type, slug, name = undefined, existsOnR2 = false) {
  const asset = {
    type,
    slug,
    needsUpload: calculateNeedsUpload(existsOnR2)
  };
  if (name !== undefined) {
    asset.name = name;
  }
  if (existsOnR2 !== undefined) {
    asset.existsOnR2 = existsOnR2;
  }
  return asset;
}

/**
 * Merge asset data
 *
 * Pure function for merging existing asset with updated data.
 *
 * @param {Object}  existing                    Existing asset object
 * @param {Object}  updated                     Updated asset data
 * @param {Object}  options                     Merge options
 * @param {boolean} options.preserveNeedsUpload Preserve existing needsUpload flag
 * @return {Object} Merged asset
 */
function mergeAsset(existing, updated, options = {}) {
  const {
    preserveNeedsUpload = false
  } = options;

  // If no existing asset, treat updated as new
  if (!existing) {
    const normalized = normalizeAssetData(updated);
    return {
      ...normalized,
      needsUpload: calculateNeedsUpload(normalized.existsOnR2)
    };
  }

  // If no update, return existing
  if (!updated) {
    return existing;
  }

  // Normalize updated data
  const normalized = normalizeAssetData(updated);

  // Merge data
  const merged = {
    ...existing,
    ...normalized
  };

  // Calculate or preserve needsUpload
  if (preserveNeedsUpload && 'needsUpload' in existing) {
    merged.needsUpload = existing.needsUpload;
  } else if ('existsOnR2' in merged) {
    merged.needsUpload = calculateNeedsUpload(merged.existsOnR2);
  }
  return merged;
}

/**
 * Filter assets that need upload
 *
 * Pure function to extract changed assets as type:slug strings.
 *
 * @param {Object} assets Assets object
 * @return {Array<string>} Array of "type:slug" strings
 */
function filterChangedAssets(assets) {
  if (!assets || typeof assets !== 'object') {
    return [];
  }
  return Object.values(assets).filter(asset => asset && asset.needsUpload).map(asset => `${asset.type}:${asset.slug}`);
}

/**
 * Clear all upload flags
 *
 * Pure function to set needsUpload=false for all assets.
 *
 * @param {Object} assets Assets object
 * @return {Object} New assets object with cleared flags
 */
function clearAllUploadFlags(assets) {
  if (!assets || typeof assets !== 'object') {
    return {};
  }
  const cleared = {};
  Object.keys(assets).forEach(slug => {
    cleared[slug] = {
      ...assets[slug],
      needsUpload: false
    };
  });
  return cleared;
}

/**
 * Asset Manager Service Class
 *
 * Handles asset state operations with localStorage integration.
 */
class AssetManagerService {
  /**
   * Create service instance
   *
   * @param {Object} storage Storage implementation (injectable for testing)
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Load assets from storage
   *
   * @return {Object} Assets object
   */
  load() {
    return this.storage.get(STORAGE_KEY, {});
  }

  /**
   * Save assets to storage
   *
   * @param {Object} assets Assets to save
   * @return {void}
   */
  save(assets) {
    this.storage.set(STORAGE_KEY, assets);
  }

  /**
   * Mark asset as changed (needs upload)
   *
   * @param {Object} currentAssets Current assets state
   * @param {string} type          Asset type
   * @param {string} slug          Asset slug
   * @return {Object} Updated assets state
   */
  markAsChanged(currentAssets, type, slug) {
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = existingAsset ? {
      ...existingAsset,
      needsUpload: true
    } : createAsset(type, slug);
    return updated;
  }

  /**
   * Update asset from server data
   *
   * @param {Object} currentAssets Current assets state
   * @param {Object} assetData     Server asset data
   * @return {Object} Updated assets state
   */
  updateFromServer(currentAssets, assetData) {
    const normalized = normalizeAssetData(assetData);
    const {
      slug
    } = normalized;
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = mergeAsset(existingAsset, normalized);
    return updated;
  }

  /**
   * Sync multiple assets from server
   *
   * @param {Object} currentAssets Current assets state
   * @param {Array}  serverAssets  Array of server asset data
   * @return {Object} Updated assets state
   */
  syncWithServer(currentAssets, serverAssets) {
    if (!Array.isArray(serverAssets)) {
      return currentAssets;
    }
    const updated = {
      ...currentAssets
    };
    serverAssets.forEach(assetData => {
      const normalized = normalizeAssetData(assetData);
      const {
        slug
      } = normalized;
      const existingAsset = updated[slug];

      // Preserve needsUpload if asset was locally marked as changed
      updated[slug] = mergeAsset(existingAsset, normalized, {
        preserveNeedsUpload: !!existingAsset?.needsUpload
      });
    });
    return updated;
  }
}
;// ./assets/src/export/hooks/useAssetManager.js
/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage.
 * Uses AssetManagerService for all business logic.
 *
 */




function useAssetManager() {
  const [assets, setAssets] = (0,external_wp_element_namespaceObject.useState)({});

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new AssetManagerService(storage), []);

  // Load assets from localStorage on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const data = service.load();
    setAssets(data);
  }, [service]);

  // Save assets to localStorage whenever they change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    service.save(assets);
  }, [service, assets]);
  const markAsChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    setAssets(prev => service.markAsChanged(prev, type, slug));
  }, [service]);
  const updateFromServer = (0,external_wp_element_namespaceObject.useCallback)(assetData => {
    setAssets(prev => service.updateFromServer(prev, assetData));
  }, [service]);
  const syncWithServer = (0,external_wp_element_namespaceObject.useCallback)(serverAssets => {
    setAssets(prev => service.syncWithServer(prev, serverAssets));
  }, [service]);
  const getChangedAssets = (0,external_wp_element_namespaceObject.useCallback)(() => {
    return filterChangedAssets(assets);
  }, [assets]);
  const clearUploadFlags = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setAssets(prev => clearAllUploadFlags(prev));
  }, []);
  return {
    assets,
    markAsChanged,
    updateFromServer,
    syncWithServer,
    getChangedAssets,
    clearUploadFlags
  };
}
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ./assets/src/export/utils/assetTracker.js
/**
 * Asset Tracker
 *
 * Tracks uploaded assets to prevent duplicate uploads.
 *
 */

/**
 * Create an asset tracker instance.
 *
 * @return {Object} Asset tracker instance.
 */
function createAssetTracker() {
  // Track uploaded assets by normalized URL.
  const uploadedAssets = new Set();
  // Track failed assets by normalized URL.
  const failedAssets = new Set();

  /**
   * Check if an asset has already been uploaded.
   *
   * @param {string} url Asset URL.
   * @return {boolean} True if already uploaded.
   */
  function isUploaded(url) {
    // Normalize URL for comparison (remove fragments, trailing slashes).
    const normalized = normalizeUrl(url);
    return uploadedAssets.has(normalized);
  }

  /**
   * Mark an asset as uploaded.
   *
   * @param {string} url Asset URL.
   */
  function markUploaded(url) {
    const normalized = normalizeUrl(url);
    uploadedAssets.add(normalized);
  }

  /**
   * Mark an asset as failed.
   *
   * @param {string} url Asset URL.
   */
  function markFailed(url) {
    const normalized = normalizeUrl(url);
    failedAssets.add(normalized);
  }

  /**
   * Check if an asset has failed.
   *
   * @param {string} url Asset URL.
   * @return {boolean} True if failed.
   */
  function isFailed(url) {
    const normalized = normalizeUrl(url);
    return failedAssets.has(normalized);
  }

  /**
   * Get count of uploaded assets.
   *
   * @return {number} Number of uploaded assets.
   */
  function getCount() {
    return uploadedAssets.size;
  }

  /**
   * Get count of failed assets.
   *
   * @return {number} Number of failed assets.
   */
  function getFailedCount() {
    return failedAssets.size;
  }

  /**
   * Clear all tracked assets.
   */
  function clear() {
    uploadedAssets.clear();
    failedAssets.clear();
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove fragments.
      urlObj.hash = '';
      // Remove trailing slash from path.
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is (will still work for exact matches).
      return url;
    }
  }
  return {
    isUploaded,
    markUploaded,
    markFailed,
    isFailed,
    getCount,
    getFailedCount,
    clear
  };
}
;// ./assets/src/utils/manifestManager.js
/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json in each provider's storage location.
 *
 */

/**
 * Fetch existing manifest from remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
async function fetchManifest(storageService) {
  try {
    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      return {};
    }
    return {};
  }
}

/**
 * Update manifest entry with size, hash, and optional content-type.
 *
 * @param {Object} manifest    Manifest object to update.
 * @param {string} storageKey  Storage key/path for the file.
 * @param {number} size        File size in bytes.
 * @param {string} hash        SHA-256 hash hex string.
 * @param {string} contentType Optional content-type header value.
 * @return {Object} Updated manifest object.
 */
function updateManifestEntry(manifest, storageKey, size, hash, contentType = null) {
  if (!manifest) {
    manifest = {};
  }
  manifest[storageKey] = {
    size,
    hash
  };

  // Add content-type if provided
  if (contentType) {
    manifest[storageKey].contentType = contentType;
  }
  return manifest;
}

/**
 * Check if file should be skipped based on size and hash comparison.
 *
 * Two-stage check: size first, then hash if size matches.
 * Returns true if both size and hash match existing entry.
 *
 * @param {Object} manifest   Manifest object.
 * @param {string} storageKey Storage key/path for the file.
 * @param {number} size       File size in bytes.
 * @param {string} hash       SHA-256 hash hex string.
 * @return {boolean} True if file should be skipped (size and hash match).
 */
function manifestManager_shouldSkipUpload(manifest, storageKey, size, hash) {
  if (!manifest || !manifest[storageKey]) {
    // No entry in manifest, don't skip.
    return false;
  }
  const entry = manifest[storageKey];

  // Stage 1: Check size first (fast comparison).
  if (entry.size !== size) {
    return false;
  }

  // Stage 2: Check hash if size matches.
  if (entry.hash !== hash) {
    return false;
  }

  // Both size and hash match - skip upload.

  return true;
}

/**
 * Clean up manifest by removing entries not in current upload set.
 *
 * This prevents manifest from growing indefinitely as files are added/removed.
 * Returns a new manifest object containing only entries for files in currentFiles set.
 *
 * @param {Object} manifest     Existing manifest object.
 * @param {Set}    currentFiles Set of storage keys for files in current upload.
 * @return {Object} Cleaned manifest object.
 */
function cleanupManifest(manifest, currentFiles) {
  if (!manifest || !currentFiles) {
    return manifest || {};
  }
  const cleanedManifest = {};

  // Keep only entries for files that exist in current upload
  // Also preserve wp-content.zip entries (uploaded in parallel step)
  for (const storageKey of Object.keys(manifest)) {
    if (currentFiles.has(storageKey) || storageKey.includes('/wp-content.zip')) {
      cleanedManifest[storageKey] = manifest[storageKey];
    }
  }
  return cleanedManifest;
}

/**
 * Upload manifest to remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @return {Promise<boolean>} True if upload succeeded.
 */
async function uploadManifest(storageService, manifest) {
  try {
    // Convert manifest to JSON blob (minified for smaller file size).
    const manifestJson = JSON.stringify(manifest);
    const manifestBlob = new Blob([manifestJson], {
      type: 'application/json'
    });

    // Upload manifest via storage service.
    const result = await storageService.uploadManifest(manifestBlob);
    if (result.success) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
;// ./assets/src/export/utils/staticSiteConfig.js
/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 */



/**
 * Build storage configuration object.
 *
 * @param {string} siteUrl       WordPress site URL.
 * @param {string} staticSiteUrl Target static site URL.
 * @param {string} providerId    Provider ID.
 * @return {Object} Storage configuration.
 */
function buildStorageConfig(siteUrl, staticSiteUrl, providerId) {
  return {
    public_url: siteUrl,
    base_url: staticSiteUrl || siteUrl,
    provider_id: providerId
  };
}

/**
 * Calculate total files to upload from pre-scan results.
 *
 * @param {number} cachedHtmlCount Number of HTML files cached.
 * @param {number} uniqueAssets    Number of unique assets.
 * @return {number} Total files to upload.
 */
function calculateTotalFiles(cachedHtmlCount, uniqueAssets) {
  return cachedHtmlCount + uniqueAssets;
}

/**
 * Build the final result object from upload phase.
 *
 * @param {Object} failures           Failure tracking object.
 * @param {Object} assetTracker       Asset tracker instance.
 * @param {number} filesUploaded      Number of files uploaded.
 * @param {number} filesSkipped       Number of files skipped.
 * @param {number} totalFilesToUpload Total files to upload.
 * @param {Array}  uploadedFiles      Array of uploaded file info.
 * @param {number} totalUrls          Total URLs processed.
 * @return {Object} Result object.
 */
function buildUploadResult(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls) {
  return {
    // Success if we uploaded files - asset failures shouldn't fail the entire export
    success: filesUploaded > 0,
    urlsProcessed: totalUrls,
    urlsSucceeded: failures.urlsSucceeded,
    urlsFailed: failures.urlsFailed,
    assetsUploaded: assetTracker.getCount(),
    assetsFailed: failures.assetsFailed,
    failedUrls: failures.failedUrls,
    uploadedFiles,
    filesUploaded,
    filesSkipped,
    totalFilesToUpload
  };
}

/**
 * Create initial failure tracking object.
 *
 * @return {Object} Failure tracking object.
 */
function createFailureTracker() {
  return {
    urlsFailed: 0,
    urlsSucceeded: 0,
    assetsFailed: 0,
    failedUrls: []
  };
}

/**
 * Fetch provider configuration from REST API.
 *
 * @param {string} staticSiteProviderId Provider ID from parameter.
 * @return {Promise<Object>} Provider configuration object.
 */
async function fetchProviderConfig(staticSiteProviderId) {
  let providerConfig = {};
  try {
    // CRITICAL: Always use the exact provider ID passed in
    // Do NOT do provider discovery - this breaks multi-instance threading
    // where each thread needs its OWN provider instance config
    if (!staticSiteProviderId) {
      throw new Error('Provider ID is required for fetchProviderConfig. ' + 'Provider discovery should not be used in threaded contexts.');
    }

    // Use ConfigStorage to load provider config (handles caching and REST API)
    const {
      ConfigStorage
    } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 906));
    const storage = new ConfigStorage(staticSiteProviderId);
    providerConfig = await storage.load();
  } catch (error) {
    // Re-throw to make failures visible instead of silently using wrong config
    throw error;
  }
  return providerConfig;
}

/**
 * Create and configure storage service.
 *
 * Uses the StorageService adapter pattern for provider instance isolation.
 * Each provider type registers a filter on 'aether.storage.service.create' to
 * inject its own StorageService with a provider-specific upload adapter.
 *
 * @param {string} staticPath     Static files path.
 * @param {Object} config         Storage configuration.
 * @param {string} providerId     Provider ID (full instance ID with UUID).
 * @param {Object} providerConfig Provider configuration (already loaded).
 * @return {Promise<Object>} Storage service instance.
 */
async function createStorageService(staticPath, config, providerId, providerConfig) {
  // Filter configuration
  const filteredConfig = (0,external_wp_hooks_.applyFilters)('aether.storage.service.config', config, staticPath, providerId, providerConfig);

  // Allow filter to override storage service creation
  // Pass providerConfig as 5th parameter so providers can use it
  // (WordPress filters are synchronous, so config must be pre-loaded)
  let storageService = (0,external_wp_hooks_.applyFilters)('aether.storage.service.create', null, staticPath, filteredConfig, providerId, providerConfig);

  // Create default if not overridden
  if (!storageService) {
    const {
      StorageService
    } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 118));
    storageService = new StorageService(staticPath, filteredConfig);
  }
  return storageService;
}
;// ./assets/src/export/utils/urlUtils.js
/**
 * URL Utilities
 *
 * Pure functions for URL parsing, resolution, and normalization.
 *
 */



/**
 * Resolve relative URL against a base URL.
 *
 * @param {string} url     Relative or absolute URL.
 * @param {string} baseUrl Base URL for resolution.
 * @return {string} Absolute URL.
 */
function resolveRelative(url, baseUrl) {
  // Data URLs should never be resolved - return as-is.
  if (url.startsWith('data:')) {
    return url;
  }

  // Already absolute.
  try {
    new URL(url);
    return url;
  } catch {
    // Not a valid absolute URL, continue
  }

  // Protocol-relative.
  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  // Absolute path.
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return base.origin + url;
  }

  // Relative to base URL directory.
  const base = new URL(baseUrl);
  const baseDir = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
  const resolvedUrl = base.origin + baseDir + '/' + url;
  return (0,external_wp_hooks_.applyFilters)('aether.url.resolve', resolvedUrl, url, baseUrl);
}

/**
 * Check if URL is external to the site.
 *
 * @param {string} url     URL to check.
 * @param {string} siteUrl Site URL for comparison.
 * @return {boolean} True if external.
 */
function isExternal(url, siteUrl) {
  // Relative URLs are not external.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return false;
  }
  let isExternalUrl = false;

  // URLs that start with http:// or https:// - check host.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      isExternalUrl = true;
    }
  }
  // Protocol-relative URLs - check host.
  else if (url.startsWith('//')) {
    try {
      const urlObj = new URL('https:' + url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      isExternalUrl = true;
    }
  }
  // If it doesn't start with a scheme or /, treat as external to be safe.
  else {
    isExternalUrl = true;
  }
  return (0,external_wp_hooks_.applyFilters)('aether.url.is_external', isExternalUrl, url, siteUrl);
}

/**
 * Force URL to use HTTPS scheme.
 *
 * @param {string} url URL to convert.
 * @return {string} URL with HTTPS scheme.
 */
function forceHttps(url) {
  // Skip data URLs, anchors, and protocol-relative URLs.
  if (url.startsWith('data:') || url.startsWith('#') || url.startsWith('//')) {
    return url;
  }

  // Convert http:// to https://.
  if (url.startsWith('http://')) {
    return 'https://' + url.substring(7);
  }
  return url;
}

/**
 * Strip WordPress Playground scope from path.
 *
 * WordPress Playground uses scoped URLs like:
 * https://playground.wordpress.net/scope:happy-classic-town/
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
function stripPlaygroundScope(path) {
  let result = path.replace(/^\/?scope:[a-z0-9.:-]+\//i, '');
  result = result.replace(/\/scope:[a-z0-9.:-]+\//gi, '/');
  result = result.replace(/^\/?scope:[a-z0-9.:-]+$/i, '');
  return result;
}

/**
 * Normalize a URL for comparison.
 *
 * @param {string} url     URL to normalize.
 * @param {string} siteUrl Site URL for HTTPS enforcement.
 * @return {string} Normalized URL.
 */
function normalize(url, siteUrl) {
  // Handle relative URLs.
  if (url.startsWith('/') && !url.startsWith('//')) {
    try {
      const siteObj = new URL(siteUrl);
      url = siteObj.origin + url;
    } catch {
      // If siteUrl is invalid, return as-is
    }
  }

  // Strip WordPress Playground scope from URL path.
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname) {
      urlObj.pathname = stripPlaygroundScope(urlObj.pathname);
      url = urlObj.toString();
    }
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      const strippedPath = stripPlaygroundScope(pathMatch[1]);
      url = url.replace(pathMatch[1], strippedPath);
    }
  }

  // Remove URL fragments.
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1) {
    url = url.substring(0, fragmentIndex);
  }

  // Remove trailing slash.
  url = url.replace(/\/$/, '');
  return (0,external_wp_hooks_.applyFilters)('aether.url.normalize', url, siteUrl);
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract host from a URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string if invalid.
 */
function extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}

/**
 * Check if URL should be skipped (anchors, data URLs, CF Images).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if should skip.
 */
function shouldSkipUrl(url) {
  return url.startsWith('#') || url.startsWith('data:') || url.includes('imagedelivery.net');
}
;// ./assets/src/export/utils/htmlRewriting.js
/**
 * HTML Rewriting Utilities
 *
 * Helper functions for HTML URL rewriting.
 *
 */



/**
 * Protect inline script content by replacing with placeholders.
 *
 * @param {string} html HTML content.
 * @return {Object} Object with protected HTML and placeholders map.
 */
function protectScriptContent(html) {
  const placeholders = {};
  let counter = 0;
  const protectedHtml = html.replace(/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis, (match, openingAttrs, content) => {
    if (content.trim()) {
      const placeholder = `___SCRIPT_CONTENT_${counter}___`;
      placeholders[placeholder] = content;
      counter++;
      return `<script${openingAttrs}>${placeholder}</script>`;
    }
    return match;
  });
  return {
    html: protectedHtml,
    placeholders
  };
}

/**
 * Restore inline script content from placeholders.
 *
 * @param {string} html         HTML content with placeholders.
 * @param {Object} placeholders Placeholders map.
 * @return {string} HTML with restored script content.
 */
function restoreScriptContent(html, placeholders) {
  let result = html;
  for (const placeholder in placeholders) {
    if (placeholders.hasOwnProperty(placeholder)) {
      result = result.replace(placeholder, placeholders[placeholder]);
    }
  }
  return result;
}

/**
 * Collect all site URL matches from HTML.
 *
 * @param {string} html     HTML content.
 * @param {string} siteHost Site host to match.
 * @return {Array} Array of match objects with index, length, match, and type.
 */
function collectSiteUrlMatches(html, siteHost) {
  const escapedHost = escapeRegex(siteHost);
  const matches = [];
  const httpPattern = new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const httpsPattern = new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const protocolRelativePattern = new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi');
  let match;
  while ((match = httpPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'http'
    });
  }
  while ((match = httpsPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'https'
    });
  }
  while ((match = protocolRelativePattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'protocol-relative'
    });
  }

  // Sort by index
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

/**
 * Replace site URL matches in HTML.
 *
 * @param {string}   html       HTML content.
 * @param {Array}    matches    Match objects from collectSiteUrlMatches.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with replaced URLs.
 */
function replaceSiteUrlMatches(html, matches, rewriteUrl, contextUrl) {
  let result = '';
  let lastIndex = 0;
  let lastMatchEnd = 0;
  for (const matchData of matches) {
    // Skip overlapping matches
    if (matchData.index < lastMatchEnd) {
      continue;
    }

    // Skip CF Images URLs
    if (matchData.match.includes('imagedelivery.net')) {
      continue;
    }
    let urlToRewrite = matchData.match;
    if (matchData.type === 'protocol-relative') {
      urlToRewrite = 'https:' + matchData.match;
    }
    const rewritten = rewriteUrl(urlToRewrite, contextUrl);
    if (rewritten !== urlToRewrite) {
      result += html.substring(lastIndex, matchData.index);
      result += rewritten;
      lastIndex = matchData.index + matchData.length;
      lastMatchEnd = matchData.index + matchData.length;
    } else {
      lastMatchEnd = matchData.index + matchData.length;
    }
  }
  result += html.substring(lastIndex);
  return result;
}

/**
 * Rewrite absolute paths in HTML attributes.
 *
 * @param {string} html     HTML content.
 * @param {string} basePath Base path to prepend.
 * @return {string} HTML with rewritten paths.
 */
function rewriteAbsolutePaths(html, basePath) {
  if (!basePath || basePath === '' || basePath === '/') {
    return html;
  }
  const result = html.replace(/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi, (match, attrPart, quote, path) => {
    // Skip if already includes the base path
    if (path.startsWith(basePath + '/')) {
      return match;
    }

    // Skip anchors and special paths
    if (path === '/' || path.startsWith('/#') || path.startsWith('/data:')) {
      return match;
    }
    const rewrittenPath = basePath + path;
    return attrPart + quote + rewrittenPath + quote;
  });
  return result;
}

/**
 * Rewrite srcset attribute URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten srcset URLs.
 */
function rewriteSrcsetUrls(html, rewriteUrl, contextUrl) {
  return html.replace(/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi, (match, tag, quote, srcsetValue) => {
    const srcsetParts = srcsetValue.split(',').map(part => {
      const trimmed = part.trim();
      const urlMatch = trimmed.match(/^([^\s]+)(\s+.+)?$/);
      if (!urlMatch) {
        return trimmed;
      }
      const url = urlMatch[1];
      const descriptor = urlMatch[2] || '';
      if (url.includes('imagedelivery.net')) {
        return trimmed;
      }
      const rewritten = rewriteUrl(url, contextUrl);
      return rewritten + descriptor;
    });
    return tag + quote + srcsetParts.join(', ') + quote;
  });
}

/**
 * Rewrite import map URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten import map URLs.
 */
function rewriteImportMaps(html, rewriteUrl, contextUrl) {
  return html.replace(/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis, (match, jsonContent) => {
    try {
      const importmap = JSON.parse(jsonContent);
      if (!importmap || typeof importmap !== 'object' || !importmap.imports) {
        return match;
      }
      for (const moduleName in importmap.imports) {
        if (importmap.imports.hasOwnProperty(moduleName)) {
          importmap.imports[moduleName] = rewriteUrl(importmap.imports[moduleName], contextUrl);
        }
      }
      const newJson = JSON.stringify(importmap);
      return match.replace(jsonContent, newJson);
    } catch {
      return match;
    }
  });
}
;// ./assets/src/export/utils/urlRewriter.js
/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 *
 */



// Import URL utilities


// Import HTML rewriting helpers


// Re-export URL utilities for backwards compatibility


/**
 * Create URL rewriter instance.
 *
 * @param {string}                 siteUrl   Site URL.
 * @param {string|null}            staticUrl Static site URL (where it will be deployed).
 * @param {Object<string, string>} urlMap    Optional URL mapping cache.
 * @return {Object} URL rewriter instance.
 */
function createUrlRewriter(siteUrl, staticUrl = null, urlMap = {}) {
  // Force HTTPS for site URL to avoid mixed content issues.
  const normalizedSiteUrl = forceHttps(siteUrl);

  // Treat empty string as null.
  const normalizedStaticUrl = staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

  // Build initial URL mapping.
  const mapping = {
    [normalizedSiteUrl]: '/',
    [normalizedSiteUrl + '/']: '/',
    ...(siteUrl !== normalizedSiteUrl ? {
      [siteUrl]: '/',
      [siteUrl + '/']: '/'
    } : {}),
    ...urlMap
  };

  /**
   * Convert WordPress URL to static path.
   *
   * @param {string} url URL to convert.
   * @return {string} Static path.
   */
  function convertToStaticPath(url) {
    // Handle relative URLs.
    if (url.startsWith('/') && !url.startsWith('//')) {
      return stripPlaygroundScope(url);
    }

    // Parse URL.
    let path = '/';
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname || '/';
    } catch {
      const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (pathMatch) {
        path = pathMatch[1];
      } else if (url.includes('?')) {
        const parts = url.split('?');
        path = parts[0];
      }
    }

    // Remove leading/trailing slashes.
    path = path.replace(/^\/+|\/+$/g, '');

    // Strip WordPress Playground scope.
    path = stripPlaygroundScope(path);
    if (!path) {
      return '/';
    }

    // Handle WordPress query parameters.
    try {
      const urlObj = new URL(url);
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        if (params.has('s')) {
          const query = params.get('s');
          return `/search/?q=${encodeURIComponent(query)}`;
        }
      }
    } catch {
      // URL parsing failed, continue with path
    }

    // Ensure trailing slash for directory-style URLs.
    path = '/' + path;

    // Add trailing slash if not a file.
    if (!/\.[a-z0-9]{2,5}$/i.test(path)) {
      path = path.replace(/\/$/, '') + '/';
    }
    return path;
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    return normalize(url, siteUrl);
  }

  /**
   * Check if URL is external.
   *
   * @param {string} url URL to check.
   * @return {boolean} True if external.
   */
  function isExternalUrl(url) {
    return isExternal(url, siteUrl);
  }

  /**
   * Rewrite a single URL.
   *
   * @param {string} url        URL to rewrite.
   * @param {string} contextUrl Context URL for relative URL resolution.
   * @return {string} Rewritten URL.
   */
  function rewriteUrl(url, contextUrl = '') {
    // Skip external URLs.
    if (isExternalUrl(url)) {
      return url;
    }

    // Skip special URLs.
    if (shouldSkipUrl(url)) {
      return url;
    }

    // Resolve relative URLs against context.
    let absoluteUrl = url;
    if (contextUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      absoluteUrl = resolveRelative(url, contextUrl);
    } else if (contextUrl && url.startsWith('/')) {
      try {
        const contextObj = new URL(contextUrl);
        absoluteUrl = contextObj.origin + url;
      } catch {
        // If context URL parsing fails, use as-is
      }
    }

    // Check URL map first.
    const urlNormalized = normalizeUrl(absoluteUrl);
    let staticPath = mapping[urlNormalized];
    if (!staticPath) {
      staticPath = convertToStaticPath(absoluteUrl);
    }

    // Apply static URL base if configured.
    let rewrittenUrl;
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        rewrittenUrl = staticUrlObj.origin + basePath + staticPath;
      } catch {
        rewrittenUrl = normalizedStaticUrl.replace(/\/$/, '') + staticPath;
      }
    } else {
      rewrittenUrl = staticPath;
    }
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Rewrite all URLs in HTML content.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    // Protect inline script content
    const {
      html: protectedHtml,
      placeholders
    } = protectScriptContent(html);
    let result = protectedHtml;

    // Extract site host and rewrite URLs
    const siteHost = extractHost(siteUrl);
    if (siteHost) {
      const matches = collectSiteUrlMatches(result, siteHost);
      result = replaceSiteUrlMatches(result, matches, rewriteUrl, contextUrl);
    }

    // Rewrite absolute paths if static URL has subdirectories
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        result = rewriteAbsolutePaths(result, basePath);
      } catch (error) {
        // Error in absolute path rewriting, continue without rewriting
      }
    }

    // Rewrite srcset and import map URLs
    result = rewriteSrcsetUrls(result, rewriteUrl, contextUrl);
    result = rewriteImportMaps(result, rewriteUrl, contextUrl);

    // Restore inline script content
    result = restoreScriptContent(result, placeholders);
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite_html', result, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }
  return {
    rewriteHtml,
    rewriteUrl,
    addUrlMapping: (originalUrl, staticPath) => {
      const normalized = normalizeUrl(originalUrl);
      mapping[normalized] = staticPath;
    },
    getUrlMapping: () => ({
      ...mapping
    })
  };
}
;// ./assets/src/export/utils/assetExclusions.js
/**
 * Asset Exclusions Configuration
 *
 * Centralized configuration for assets and URL patterns that should be excluded
 * from static site generation.
 *
 */

/**
 * Image file extensions that are served from external CDNs.
 * These are skipped when found in CSS/JS, but collected when referenced in HTML.
 */
const SKIP_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];

/**
 * Essential file extensions that should always be collected,
 * even if they are external URLs (e.g., Google Fonts).
 * These assets are critical for site functionality.
 */
const ESSENTIAL_EXTENSIONS = ['css', 'js', 'woff', 'woff2', 'ttf', 'eot', 'otf'];

/**
 * Webpack module IDs to skip (not real files, just module references).
 * These are webpack internal module IDs that don't correspond to actual files.
 */
const WEBPACK_MODULE_IDS = ['react', 'is-prop-valid', 'uncategorized', 'git-config', 'react-dom', 'react-jsx-runtime'];

/**
 * URL patterns that should be excluded from asset collection.
 * Patterns starting with '/' are checked at the start of the URL pathname.
 * Other patterns are checked anywhere in the URL using includes().
 */
const EXCLUDED_URL_PATTERNS = ['/wp-json/',
// WordPress REST API endpoints
'/xmlrpc.php',
// WordPress XML-RPC endpoint
'/wp-comments-post.php',
// WordPress comment submission endpoint (405 Method Not Allowed)
'imagedelivery.net' // External CDN (imagedelivery.net)
];

/**
 * Regex patterns for more complex exclusions.
 * These are checked after simple string patterns.
 */
const EXCLUDED_URL_REGEX_PATTERNS = [/wp-admin\/.*\.php$/ // WordPress admin PHP files (wp-admin/*.php and wp-admin/**/*.php)
];

/**
 * Check if a URL matches any excluded pattern.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedUrl(url) {
  // Check simple string patterns first.
  const matchesStringPattern = EXCLUDED_URL_PATTERNS.some(pattern => {
    // Patterns starting with '/' should match at the start of the pathname.
    if (pattern.startsWith('/')) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.startsWith(pattern);
      } catch {
        // If URL parsing fails, check if URL string starts with pattern.
        return url.startsWith(pattern);
      }
    }
    // Other patterns are checked anywhere in the URL.
    return url.includes(pattern);
  });
  if (matchesStringPattern) {
    return true;
  }

  // Check regex patterns for more complex exclusions.
  // Extract pathname for regex matching to avoid matching query strings or fragments.
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(pathname));
  } catch {
    // If URL parsing fails, test against full URL string.
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(url));
  }
}

/**
 * Check if a file extension is in the skip list.
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension should be skipped.
 */
function isSkippedExtension(extension) {
  return SKIP_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a file extension is essential (always collected).
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension is essential.
 */
function isEssentialExtension(extension) {
  return ESSENTIAL_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a module ID is a webpack internal reference.
 *
 * @param {string} moduleId Module ID to check.
 * @return {boolean} True if module ID should be skipped.
 */
function isWebpackModuleId(moduleId) {
  return WEBPACK_MODULE_IDS.includes(moduleId);
}
;// ./assets/src/export/utils/assetPatterns.js
/**
 * Asset Patterns
 *
 * Regex patterns for asset extraction from HTML, CSS, and JS.
 *
 */

/**
 * Stylesheet link patterns.
 * Two patterns handle both attribute orders: href-first and rel-first.
 */
const STYLESHEET_PATTERNS = [/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi, /<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi];

/**
 * Script src pattern.
 */
const SCRIPT_PATTERN = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

/**
 * Inline CSS in style tags pattern.
 */
const INLINE_CSS_PATTERN = /<style[^>]*>(.*?)<\/style>/gis;

/**
 * Inline JS in script tags pattern.
 */
const INLINE_JS_PATTERN = /<script[^>]*>(.*?)<\/script>/gis;

/**
 * Import map pattern.
 */
const IMPORT_MAP_PATTERN = /<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;

/**
 * CSS @import pattern.
 */
const CSS_IMPORT_PATTERN = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;

/**
 * CSS url() pattern.
 */
const CSS_URL_PATTERN = /url\(["']?([^"')]+)["']?\)/gi;

/**
 * JS import patterns.
 */
const JS_IMPORT_PATTERNS = {
  // ES6 import: import ... from 'module'
  es6: /import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi,
  // Dynamic import: import('module')
  dynamic: /import\s*\(\s*["']([^"']+)["']\s*\)/gi,
  // CommonJS require: require('module')
  require: /require\s*\(\s*["']([^"']+)["']\s*\)/gi
};

/**
 * JS asset reference patterns.
 */
const JS_ASSET_PATTERNS = [
// new URL() constructor
/new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
// String literals with asset extensions
/["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi];

/**
 * HTML attribute patterns for asset extraction.
 */
const HTML_ATTR_PATTERNS = [/<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi, /<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi];

/**
 * Srcset patterns.
 */
const SRCSET_PATTERNS = {
  img: /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi,
  source: /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi
};

/**
 * Inline style attribute pattern.
 */
const INLINE_STYLE_PATTERN = /style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;

/**
 * Asset type map by extension.
 */
const ASSET_TYPE_MAP = {
  css: 'css',
  js: 'js',
  woff: 'font',
  woff2: 'font',
  ttf: 'font',
  otf: 'font',
  eot: 'font'
};

/**
 * Get file extension from URL.
 *
 * @param {string} url URL to extract extension from.
 * @return {string} File extension in lowercase, or empty string.
 */
function getExtensionFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return '';
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type ('css', 'js', 'font', or 'other').
 */
function getAssetType(url) {
  const extension = getExtensionFromUrl(url);
  return ASSET_TYPE_MAP[extension] || 'other';
}

/**
 * Parse srcset value into array of URLs.
 *
 * @param {string} srcsetValue Srcset attribute value.
 * @return {Array<string>} Array of URLs (without descriptors).
 */
function parseSrcset(srcsetValue) {
  return srcsetValue.split(',').map(part => {
    const trimmed = part.trim();
    const urlMatch = trimmed.match(/^([^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }).filter(Boolean);
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function assetPatterns_escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract host from URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string.
 */
function assetPatterns_extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}
;// ./assets/src/export/utils/assetFilters.js
/**
 * Asset Filters
 *
 * Pure functions for determining which assets to collect.
 *
 */






/**
 * Extract module ID from URL for webpack checking.
 *
 * @param {string} url URL to extract module ID from.
 * @return {string|null} Module ID or null.
 */
function extractModuleId(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || pathname;
    return filename.replace(/\.[^.]*$/, '');
  } catch {
    const filenameMatch = url.match(/\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/);
    return filenameMatch ? filenameMatch[1] : null;
  }
}

/**
 * Check if asset should be collected.
 *
 * @param {string} url     Asset URL.
 * @param {string} siteUrl Site URL.
 * @param {string} source  Source where asset was found ('html', 'css', 'js').
 * @return {boolean} True if should collect.
 */
function shouldCollectAsset(url, siteUrl, source = 'css') {
  // FILTER 0: Skip webpack module IDs (not real files)
  const moduleId = extractModuleId(url);
  if (moduleId && isWebpackModuleId(moduleId)) {
    return false;
  }

  // Get file extension
  const extension = getExtensionFromUrl(url);

  // FILTER 1: Skip excluded URL patterns
  if (isExcludedUrl(url)) {
    return false;
  }

  // FILTER 2: Skip external URLs - can't fetch due to CORS, keep original URLs in HTML
  if (isExternal(url, siteUrl)) {
    return false;
  }

  // PRIORITY 1: Collect essential assets (CSS, JS, fonts) if they are internal
  if (isEssentialExtension(extension)) {
    return true;
  }

  // PRIORITY 2: Collect images when referenced in HTML (internal URLs only)
  if (source === 'html' && isSkippedExtension(extension)) {
    return true;
  }

  // FILTER 3: Skip image files when found in CSS/JS
  if (isSkippedExtension(extension)) {
    return false;
  }

  // FILTER 4: Skip HTML page URLs (no extension) when found in HTML
  // These are internal page links, not assets - they should NOT be collected
  // as assets because they would be uploaded without URL rewriting
  if (source === 'html' && !extension) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Skip if pathname ends with / or has no file extension
      if (pathname.endsWith('/') || !pathname.includes('.')) {
        return false;
      }
    } catch {
      // If URL parsing fails and no extension, skip it
      return false;
    }
  }

  // PRIORITY 3: For other assets, apply filter hook
  let shouldCollect = true;

  /**
   * Filter whether an asset should be collected.
   *
   * @param {boolean} shouldCollect Whether to collect this asset.
   * @param {string}  url           Asset URL.
   * @param {string}  siteUrl       Site URL.
   * @param {string}  source        Asset source.
   * @param {string}  extension     File extension.
   */
  shouldCollect = (0,external_wp_hooks_.applyFilters)('aether.assets.should_collect', shouldCollect, url, siteUrl, source, extension);
  return shouldCollect;
}
;// ./assets/src/export/utils/assetExtractor.js
/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
 *
 */







/**
 * Extract asset URLs from HTML content.
 *
 * @param {string} html    HTML content.
 * @param {string} pageUrl Page URL for resolving relative URLs.
 * @param {string} siteUrl Site URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of asset URLs.
 */
async function extractAssetsFromHtml(html, pageUrl, siteUrl) {
  const collected = new Set();
  const processed = new Set();

  // Collect stylesheets
  for (const pattern of STYLESHEET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const cssUrl = match[2];
      const resolvedUrl = resolveRelative(cssUrl, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }
  }

  // Collect scripts
  SCRIPT_PATTERN.lastIndex = 0;
  const scriptMatches = html.matchAll(SCRIPT_PATTERN);
  for (const match of scriptMatches) {
    const jsUrl = match[2];
    const resolvedUrl = resolveRelative(jsUrl, pageUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
      collected.add(resolvedUrl);
      await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
    }
  }

  // Collect from inline CSS
  INLINE_CSS_PATTERN.lastIndex = 0;
  const inlineCssMatches = html.matchAll(INLINE_CSS_PATTERN);
  for (const match of inlineCssMatches) {
    collectCssInlineDependencies(match[1], pageUrl, siteUrl, collected);
  }

  // Collect from inline JS
  INLINE_JS_PATTERN.lastIndex = 0;
  const inlineJsMatches = html.matchAll(INLINE_JS_PATTERN);
  for (const match of inlineJsMatches) {
    await collectJsInlineDependencies(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from import maps
  IMPORT_MAP_PATTERN.lastIndex = 0;
  const importMapMatches = html.matchAll(IMPORT_MAP_PATTERN);
  for (const match of importMapMatches) {
    await collectImportmapModules(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from HTML attributes
  collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected);
  let assets = Array.from(collected);
  assets = (0,external_wp_hooks_.applyFilters)('aether.assets.extracted', assets, html, pageUrl, siteUrl);
  return assets;
}

/**
 * Collect assets from HTML attributes.
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 */
function collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected) {
  const siteHost = assetPatterns_extractHost(siteUrl);
  if (siteHost) {
    const escapedHost = assetPatterns_escapeRegex(siteHost);
    const patterns = [new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi')];
    const allMatches = new Set();
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[0];
        if (!url.includes('imagedelivery.net')) {
          // Protocol-relative URLs (third pattern, index 2)
          if (i === 2) {
            try {
              const siteUrlObj = new URL(siteUrl);
              allMatches.add(siteUrlObj.protocol + url);
            } catch {
              allMatches.add('https:' + url);
            }
          } else {
            allMatches.add(url);
          }
        }
      }
    }
    for (const url of allMatches) {
      const resolvedUrl = resolveRelative(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from attribute patterns
  for (const pattern of HTML_ATTR_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[2];
      const resolvedUrl = resolveRelative(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from srcset
  for (const [, pattern] of Object.entries(SRCSET_PATTERNS)) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const urls = parseSrcset(match[2]);
      for (const url of urls) {
        const resolvedUrl = resolveRelative(url, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
          collected.add(resolvedUrl);
        }
      }
    }
  }

  // Collect from inline styles
  INLINE_STYLE_PATTERN.lastIndex = 0;
  const inlineStyleMatches = html.matchAll(INLINE_STYLE_PATTERN);
  for (const match of inlineStyleMatches) {
    let inlineCss = match[2];
    inlineCss = inlineCss.replace(/\\(["'])/g, '$1');
    collectCssInlineDependencies(inlineCss, pageUrl, siteUrl, collected, 'html');
  }
}

/**
 * Collect modules from import map.
 *
 * @param {string}      json      Import map JSON.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectImportmapModules(json, pageUrl, siteUrl, collected, processed) {
  try {
    const importmap = JSON.parse(json);
    if (!importmap?.imports) {
      return;
    }
    for (const moduleName in importmap.imports) {
      if (importmap.imports.hasOwnProperty(moduleName)) {
        const moduleUrl = importmap.imports[moduleName];
        const resolvedUrl = resolveRelative(moduleUrl, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  } catch {
    // Invalid JSON
  }
}

/**
 * Collect CSS dependencies.
 *
 * @param {string}      cssUrl    CSS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectCssDependencies(cssUrl, siteUrl, collected, processed) {
  if (processed.has(cssUrl)) {
    return;
  }
  processed.add(cssUrl);
  try {
    const response = await fetch(cssUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const cssContent = await response.text();

    // @import statements
    CSS_IMPORT_PATTERN.lastIndex = 0;
    const importMatches = cssContent.matchAll(CSS_IMPORT_PATTERN);
    for (const match of importMatches) {
      const resolvedUrl = resolveRelative(match[1], cssUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // url() references
    CSS_URL_PATTERN.lastIndex = 0;
    const urlMatches = cssContent.matchAll(CSS_URL_PATTERN);
    for (const match of urlMatches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:')) {
        continue;
      }
      const resolvedUrl = resolveRelative(assetUrl, cssUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
      }
    }
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect CSS inline dependencies.
 *
 * @param {string}      cssContent CSS content.
 * @param {string}      baseUrl    Base URL.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected URLs.
 * @param {string}      source     Source type.
 */
function collectCssInlineDependencies(cssContent, baseUrl, siteUrl, collected, source = 'css') {
  CSS_URL_PATTERN.lastIndex = 0;
  const urlMatches = cssContent.matchAll(CSS_URL_PATTERN);
  for (const match of urlMatches) {
    const assetUrl = match[1];
    if (assetUrl.startsWith('data:')) {
      continue;
    }
    const resolvedUrl = resolveRelative(assetUrl, baseUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, source)) {
      collected.add(resolvedUrl);
    }
  }
}

/**
 * Collect JS dependencies.
 *
 * @param {string}      jsUrl     JS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsDependencies(jsUrl, siteUrl, collected, processed) {
  if (processed.has(jsUrl)) {
    return;
  }
  processed.add(jsUrl);
  try {
    const response = await fetch(jsUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const jsContent = await response.text();

    // Process all import patterns
    for (const [, pattern] of Object.entries(JS_IMPORT_PATTERNS)) {
      pattern.lastIndex = 0;
      const matches = jsContent.matchAll(pattern);
      for (const match of matches) {
        const importUrl = match[1];
        if (isWebpackModuleId(importUrl)) {
          continue;
        }
        const resolvedUrl = resolveRelative(importUrl, jsUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
    await collectJsInlineDependencies(jsContent, jsUrl, siteUrl, collected, processed);
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect JS inline dependencies.
 *
 * @param {string}      jsContent JS content.
 * @param {string}      baseUrl   Base URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsInlineDependencies(jsContent, baseUrl, siteUrl, collected, processed) {
  for (const pattern of JS_ASSET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = jsContent.matchAll(pattern);
    for (const match of matches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:') || assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        continue;
      }
      const resolvedUrl = resolveRelative(assetUrl, baseUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        const type = getAssetType(resolvedUrl);
        if (type === 'css') {
          await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
        } else if (type === 'js') {
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  }
}

/**
 * Get asset local path.
 *
 * @param {string} url Asset URL.
 * @return {string|null} Local path or null.
 */
function getAssetLocalPath(url) {
  let path = '';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '';
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }
  path = path.replace(/^\/+/, '');
  path = stripPlaygroundScope(path);
  if (!path || path === '') {
    return null;
  }
  return path;
}
;// ./assets/src/export/utils/preScanPhase.js
/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 */





/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs and extracts assets.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @param {Object}   options.htmlData         Optional HTML data storage.
 * @return {Promise<Object>} Pre-scan results.
 */
async function executePreScan({
  urls,
  siteUrl,
  providerId,
  providerConfig,
  setStatusMessage,
  htmlData = null
}) {
  const failures = {
    urlsFailed: 0,
    failedUrls: []
  };

  // Fire pre-scan start action
  (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.pre_scan.before', urls, providerId, providerConfig);
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Scanning files to upload…', 'aether-site-exporter'), 'progress', 'scanFiles');
  }

  // Store HTML data if provided
  const dataStorage = htmlData || new Map();
  const allUniqueAssets = new Set();
  let successfulUrls = 0;

  // Scan each URL
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    // Check if URL is already in cache (from preScanStaticSite step)
    const cachedEntry = dataStorage.get(url);
    if (cachedEntry) {
      // Use cached data - validate structure
      if (cachedEntry && typeof cachedEntry === 'object' && cachedEntry.rawHtml && Array.isArray(cachedEntry.assetUrls)) {
        successfulUrls++;

        // Add cached assets to unique set
        for (const assetUrl of cachedEntry.assetUrls) {
          allUniqueAssets.add(assetUrl);
        }
        continue;
      }
    }

    // URL not in cache - this might be an asset URL (CSS, JS, image, etc.)
    // Assets are handled separately in the upload phase, so we can skip them here
    // Only fetch if it looks like it might be an HTML page
    // (We'll let the fetch determine if it's actually HTML)
    try {
      // Fetch from URL
      const htmlResponse = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (htmlResponse.status !== 200) {
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: `Failed to fetch HTML: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`
        });
        continue;
      }

      // Check content-type to ensure it's HTML
      const contentType = htmlResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        // Not HTML - likely an asset (CSS, JS, image, etc.)
        // Assets are handled separately in upload phase, skip here
        continue;
      }
      const html = await htmlResponse.text();

      // Extract assets
      const assetUrls = await extractAssetsFromHtml(html, url, siteUrl);

      // Store HTML and assets in provided data structure
      dataStorage.set(url, {
        rawHtml: html,
        assetUrls
      });
      successfulUrls++;

      // Add to unique set
      for (const assetUrl of assetUrls) {
        allUniqueAssets.add(assetUrl);
      }
    } catch (error) {
      failures.urlsFailed++;
      failures.failedUrls.push({
        url,
        reason: error.message
      });
    }
  }
  const totalFilesToUpload = successfulUrls + allUniqueAssets.size;

  // Fire completion action
  (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.pre_scan.after', {
    urlsScanned: urls.length,
    urlsSuccessful: successfulUrls,
    uniqueAssets: allUniqueAssets.size,
    totalFiles: totalFilesToUpload
  }, providerId);
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of HTML files, %2$d: Number of assets */
    (0,external_wp_i18n_namespaceObject.__)('Pre-scan complete: %1$d HTML files, %2$d assets', 'aether-site-exporter'), successfulUrls, allUniqueAssets.size), 'success', 'scanFiles');
  }
  return {
    htmlData: dataStorage,
    allUniqueAssets,
    totalFilesToUpload,
    failures,
    urlsSuccessful: successfulUrls
  };
}
;// ./assets/src/export/utils/htmlProcessor.js
/**
 * HTML Processor
 *
 * Processes HTML for static site generation.
 * Ported from PHP HTMLGeneratorService::processHtml() logic.
 *
 */



/**
 * Process HTML for static site.
 *
 * @param {string}      html          HTML content.
 * @param {string}      url           Source URL.
 * @param {string}      siteUrl       Site URL.
 * @param {string|null} staticSiteUrl Static site URL for URL rewriting.
 * @return {string} Processed HTML.
 */
function processHtml(html, url, siteUrl, staticSiteUrl = null) {
  // STEP 1: Remove admin bar from HTML (in case source was generated while logged in).
  // This removes #wpadminbar div, related CSS/JS, and body classes.
  html = removeAdminBar(html);

  // STEP 2: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
  // These features don't exist in static exports.
  html = removeDynamicWpLinks(html);

  // STEP 3: Replace all internal URLs (absolute → relative or custom domain).
  // This is the main URL rewriting step that makes the static site work.
  const urlRewriter = createUrlRewriter(siteUrl, staticSiteUrl);
  html = urlRewriter.rewriteHtml(html, url);
  return html;
}

/**
 * Remove admin bar from HTML.
 *
 * Strips the WordPress admin bar (#wpadminbar) and related styles/scripts
 * that may have been rendered if the source page was fetched while logged in.
 *
 * @param {string} html HTML content.
 * @return {string} HTML with admin bar removed.
 */
function removeAdminBar(html) {
  // Helper function to remove HTML elements by attribute matching.
  // Used to remove admin bar CSS, JS, and HTML by ID or class.
  const removeElementsByAttr = (htmlContent, element, attribute, valuePattern, exactMatch = false) => {
    // Escape regex special characters in pattern.
    const escapedPattern = valuePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build regex pattern for attribute matching.
    // exactMatch=true: id="exact-value"
    // exactMatch=false: id="contains-value-anywhere"
    let attrPattern;
    if (exactMatch) {
      attrPattern = `${attribute}=["']${escapedPattern}["']`;
    } else {
      attrPattern = `${attribute}=["'][^"']*${escapedPattern}[^"']*["']`;
    }

    // Handle self-closing tags (link).
    // Pattern: <link ... id="admin-bar-css" ... >
    if (element === 'link') {
      const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>`, 'gi');
      return htmlContent.replace(pattern, '');
    }

    // Handle tags with content (script, style, div).
    // Pattern: <script ... id="admin-bar-js" ...>...</script>
    const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>.*?<\/${element}>`, 'gis');
    return htmlContent.replace(pattern, '');
  };

  // Remove admin bar CSS link.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-css', true);

  // Remove dashicons CSS link (used by admin bar).
  html = removeElementsByAttr(html, 'link', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'dashicons-css', true);

  // Remove admin bar container div.
  html = removeElementsByAttr(html, 'link', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'script', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'style', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'div', 'id', 'wpadminbar', true);

  // Remove admin bar inline styles.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-inline-css', true);

  // Remove admin bar scripts.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-js', true);

  // Remove any remaining admin bar related inline styles.
  html = html.replace(/<style[^>]*>.*?#wpadminbar.*?<\/style>/gis, '');

  // Remove logged-in and admin-bar classes from body tag.
  // These classes affect page layout and should be removed for static site.
  const classesToRemove = ['logged-in', 'admin-bar'];
  for (const className of classesToRemove) {
    const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(class=["'][^"']*)\\b${escapedClass}\\b([^"']*["'])`, 'gi');
    html = html.replace(pattern, '$1$2');
  }

  // Add no-admin-bar class to body (opposite of admin-bar class).
  // WordPress themes use this class to adjust layout when admin bar is absent.
  if (!html.includes('no-admin-bar')) {
    html = html.replace(/(<body[^>]*class=["'][^"']*)(")/i, '$1 no-admin-bar$2');
  }

  // AGGRESSIVE CLEANUP: Remove everything between <body> and wp-site-blocks div.
  // This is a last-resort cleanup for any remaining admin bar HTML.
  // Only runs if admin bar classes are still present in HTML.
  if (html.includes('wp-admin-bar-')) {
    html = html.replace(/(<body[^>]*>).*?(<div[^>]*class=["'][^"']*wp-site-blocks)/gis, '$1$2');
  }
  return html;
}

/**
 * Remove dynamic WordPress links from HTML.
 *
 * Removes links to features that don't exist in static exports:
 * - Comments RSS feed
 * - REST API discovery
 * - XML-RPC/RSD
 *
 * @param {string} html HTML content.
 * @return {string} HTML with dynamic links removed.
 */
function removeDynamicWpLinks(html) {
  // Remove comments feed link.
  // <link rel="alternate" type="application/rss+xml" title="..." href=".../comments/feed/" />.
  html = html.replace(/<link[^>]*rel=["']alternate["'][^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi, '');

  // Alternative pattern (href before rel).
  html = html.replace(/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*rel=["']alternate["'][^>]*>/gi, '');

  // Remove REST API discovery link.
  // <link rel="https://api.w.org/" href=".../wp-json/" />.
  html = html.replace(/<link[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/gi, '');

  // Remove XML-RPC/RSD discovery link.
  // <link rel="EditURI" type="application/rsd+xml" title="RSD" href=".../xmlrpc.php" />.
  html = html.replace(/<link[^>]*rel=["']EditURI["'][^>]*type=["']application\/rsd\+xml["'][^>]*>/gi, '');

  // Alternative pattern (type before rel).
  html = html.replace(/<link[^>]*type=["']application\/rsd\+xml["'][^>]*rel=["']EditURI["'][^>]*>/gi, '');
  return html;
}

/**
 * Get static file path for a URL.
 *
 * @param {string} url URL to convert.
 * @return {string} File path (relative to static root).
 */
function getStaticFilePath(url) {
  // Extract pathname from URL.
  let path = '/';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '/';
  } catch {
    // Fallback: If URL parsing fails, extract path manually with regex.
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }

  // Handle homepage (root URL).
  if (!path || path === '/') {
    return 'index.html';
  }

  // Remove leading slash (normalize path).
  path = path.replace(/^\/+/, '');

  // Remove WordPress Playground scope prefix.
  // Playground URLs contain scope like /scope:12345/path → path
  path = stripPlaygroundScope(path);

  // Remove trailing slash (normalize path).
  path = path.replace(/\/+$/, '');

  // Check if path is empty after removing scope (homepage case).
  if (!path) {
    return 'index.html';
  }

  // Convert URL path to directory structure with index.html.
  // Example: /about → about/index.html
  // This allows static files to be served via directory URLs: example.com/about/
  return path + '/index.html';
}
;// ./assets/src/utils/concurrencyLimiter.js
/**
 * Concurrency Limiter Utility
 *
 * Limits the number of concurrent async operations to prevent overwhelming
 * the browser/server with too many simultaneous requests.
 *
 */

/**
 * Create a concurrency limiter function.
 *
 * Returns a function that wraps async operations and ensures only
 * a limited number run concurrently. Additional operations are queued
 * and executed as slots become available.
 *
 * @param {number} limit Maximum number of concurrent operations (default: 5)
 * @return {Function} Limiter function that wraps async operations
 *
 * @example
 * const limiter = createConcurrencyLimiter(3);
 * const results = await Promise.allSettled([
 *   limiter(() => asyncOperation1()),
 *   limiter(() => asyncOperation2()),
 *   limiter(() => asyncOperation3()),
 *   limiter(() => asyncOperation4()), // Will wait until one of the first 3 completes
 * ]);
 */
function createConcurrencyLimiter(limit = 5) {
  let running = 0;
  const queue = [];

  /**
   * Execute the next queued operation if slots are available.
   */
  const processQueue = () => {
    // If we're at the limit or queue is empty, nothing to do
    if (running >= limit || queue.length === 0) {
      return;
    }

    // Get next operation from queue
    const {
      operation,
      resolve,
      reject
    } = queue.shift();
    running++;

    // Execute the operation
    Promise.resolve(operation()).then(result => {
      running--;
      resolve(result);
      // Process next item in queue
      processQueue();
    }).catch(error => {
      running--;
      reject(error);
      // Process next item in queue
      processQueue();
    });
  };

  /**
   * Limiter function that wraps async operations.
   *
   * @param {Function} operation Async operation to execute
   * @return {Promise} Promise that resolves when operation completes
   */
  return operation => {
    return new Promise((resolve, reject) => {
      queue.push({
        operation,
        resolve,
        reject
      });
      processQueue();
    });
  };
}
;// ./assets/src/utils/fileHash.js
/**
 * File Hash Utility
 *
 * Utility functions for calculating SHA-256 hashes of files and blobs.
 * Uses Web Crypto API for hardware-accelerated hashing.
 *
 */

/**
 * Calculate SHA-256 hash for a File or Blob object.
 *
 * Converts the file/blob to ArrayBuffer and calculates SHA-256 hash
 * using Web Crypto API. Works with all Blob types including images
 * (WebP, PNG, JPG), CSS, JS, HTML, and other binary files.
 *
 * @param {File|Blob} file File or Blob object to hash.
 * @return {Promise<string>} Hex-encoded hash string (64 characters).
 */
async function fileHash_calculateFileHash(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error('File must be a File or Blob object');
  }
  try {
    // Convert Blob/File to ArrayBuffer for hashing.
    const arrayBuffer = await file.arrayBuffer();

    // Calculate SHA-256 hash using Web Crypto API.
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Convert ArrayBuffer to hex string.
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}
;// ./assets/src/export/utils/helpers.js
/**
 * Export Utility Functions
 *
 * Helper functions used in export-related operations.
 *
 */

/**
 * Format file size in bytes to human-readable string
 *
 * @param {number} bytes    Number of bytes
 * @param {number} decimals Number of decimal places (default: 1)
 * @return {string} Formatted file size (e.g., "2.5 MB", "123 KB")
 */
function formatFileSize(bytes, decimals = 1) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(decimals)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(decimals)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(decimals)} GB`;
}
;// ./assets/src/export/utils/errorHandler.js
/**
 * Error Handler Utility
 *
 * Provides error categorization, retry logic, and error recovery strategies
 * for the export workflow.
 *
 */



/**
 * Error categories for error handling strategies.
 *
 * @type {Object<string, string>}
 */
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  QUOTA_EXCEEDED: 'quota_exceeded',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels.
 *
 * @type {Object<string, string>}
 */
const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Default retry configuration.
 *
 * @type {Object}
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  // 1 second
  maxDelay: 10000,
  // 10 seconds
  backoffMultiplier: 2,
  retryableCategories: [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.TIMEOUT, ERROR_CATEGORIES.RATE_LIMIT]
};

/**
 * Categorize an error based on its properties.
 *
 * @param {Error} error Error object to categorize.
 * @return {string} Error category.
 */
function categorizeError(error) {
  if (!error) {
    return ERROR_CATEGORIES.UNKNOWN;
  }
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  const status = error.status || error.statusCode;

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection') || code === 'network_error' || code === 'econnrefused' || code === 'enotfound') {
    return ERROR_CATEGORIES.NETWORK;
  }

  // Timeout errors
  if (message.includes('timeout') || code === 'timeout' || status === 408) {
    return ERROR_CATEGORIES.TIMEOUT;
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many requests') || code === 'rate_limit' || status === 429) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }

  // Quota exceeded errors
  if (message.includes('quota') || message.includes('storage') || code === 'quota_exceeded' || status === 507) {
    return ERROR_CATEGORIES.QUOTA_EXCEEDED;
  }

  // Permission errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden') || code === 'permission_denied' || status === 401 || status === 403) {
    return ERROR_CATEGORIES.PERMISSION;
  }

  // Not found errors
  if (message.includes('not found') || code === 'not_found' || status === 404) {
    return ERROR_CATEGORIES.NOT_FOUND;
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || code === 'validation_error' || status === 400 || status === 422) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Determine error severity based on category and context.
 *
 * @param {string} category Error category.
 * @return {string} Error severity level.
 */
function determineSeverity(category) {
  // Critical errors that should stop the workflow
  if (category === ERROR_CATEGORIES.PERMISSION || category === ERROR_CATEGORIES.QUOTA_EXCEEDED || category === ERROR_CATEGORIES.VALIDATION) {
    return ERROR_SEVERITY.CRITICAL;
  }

  // High severity errors that may require user intervention
  if (category === ERROR_CATEGORIES.NOT_FOUND) {
    return ERROR_SEVERITY.HIGH;
  }

  // Medium severity errors that can be retried
  if (category === ERROR_CATEGORIES.NETWORK || category === ERROR_CATEGORIES.TIMEOUT || category === ERROR_CATEGORIES.RATE_LIMIT) {
    return ERROR_SEVERITY.MEDIUM;
  }

  // Low severity for unknown errors (may be recoverable)
  return ERROR_SEVERITY.LOW;
}

/**
 * Check if an error is retryable.
 *
 * @param {Error}  error  Error to check.
 * @param {Object} config Retry configuration.
 * @return {boolean} True if error is retryable.
 */
function isRetryable(error, config = {}) {
  const category = categorizeError(error);
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  return retryConfig.retryableCategories.includes(category);
}

/**
 * Calculate delay for retry attempt using exponential backoff.
 *
 * @param {number} attemptNumber Current attempt number (0-indexed).
 * @param {Object} config        Retry configuration.
 * @return {number} Delay in milliseconds.
 */
function calculateRetryDelay(attemptNumber, config = {}) {
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  const {
    initialDelay,
    maxDelay,
    backoffMultiplier
  } = retryConfig;
  const delay = initialDelay * Math.pow(backoffMultiplier, attemptNumber);
  return Math.min(delay, maxDelay);
}

/**
 * Execute a function with retry logic.
 *
 * @param {Function} fn                  Function to execute.
 * @param {Object}   options             Retry options.
 * @param {number}   options.maxRetries  Maximum number of retries.
 * @param {Function} options.onRetry     Callback called before each retry.
 * @param {Function} options.shouldRetry Function to determine if error is retryable.
 * @return {Promise<any>} Result of function execution.
 */
async function withRetry(fn, options = {}) {
  const config = {
    ...DEFAULT_RETRY_CONFIG,
    ...options
  };
  const {
    maxRetries,
    onRetry,
    shouldRetry
  } = config;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < maxRetries && (shouldRetry ? shouldRetry(error, attempt) : isRetryable(error, config));
      if (!canRetry) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config);
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Format error message for user display.
 *
 * @param {Error}  error   Error object.
 * @param {Object} context Error context.
 * @return {string} Formatted error message.
 */
function formatErrorMessage(error, context = {}) {
  const category = categorizeError(error);
  const {
    stepId,
    operation
  } = context;
  let message = error.message || (0,external_wp_i18n_namespaceObject.__)('An unknown error occurred', 'aether-site-exporter');

  // Add context information
  if (stepId) {
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Step ID, 2: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Error in step "%1$s": %2$s', 'aether-site-exporter'), stepId, message);
  }
  if (operation) {
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Operation name, 2: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Error during %1$s: %2$s', 'aether-site-exporter'), operation, message);
  }

  // Add category-specific guidance
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Please check your internet connection and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.TIMEOUT:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('The operation took too long. Please try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.RATE_LIMIT:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Too many requests. Please wait a moment and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.QUOTA_EXCEEDED:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Storage quota exceeded. Please free up space and try again.', 'aether-site-exporter');
      break;
    case ERROR_CATEGORIES.PERMISSION:
      message += ' ' + (0,external_wp_i18n_namespaceObject.__)('Permission denied. Please check your access rights.', 'aether-site-exporter');
      break;
  }
  return message;
}

/**
 * Create an error handler instance with custom configuration.
 *
 * @param {Object} config Error handler configuration.
 * @return {Object} Error handler instance.
 */
function createErrorHandler(config = {}) {
  const handlerConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };
  return {
    /**
     * Execute function with retry logic.
     *
     * @param {Function} fn      Function to execute.
     * @param {Object}   options Additional retry options.
     * @return {Promise<any>} Result.
     */
    async executeWithRetry(fn, options = {}) {
      return withRetry(fn, {
        ...handlerConfig,
        ...options
      });
    },
    /**
     * Categorize an error.
     *
     * @param {Error} error Error to categorize.
     * @return {string} Error category.
     */
    categorize(error) {
      return categorizeError(error);
    },
    /**
     * Check if error is retryable.
     *
     * @param {Error} error Error to check.
     * @return {boolean} True if retryable.
     */
    isRetryable(error) {
      return isRetryable(error, handlerConfig);
    },
    /**
     * Format error message.
     *
     * @param {Error}  error   Error to format.
     * @param {Object} context Error context.
     * @return {string} Formatted message.
     */
    formatMessage(error, context = {}) {
      return formatErrorMessage(error, context);
    }
  };
}

/**
 * Default error handler instance.
 */
const errorHandler = createErrorHandler();
;// ./assets/src/export/utils/fileUploadManager.js
/**
 * File Upload Manager Utility
 *
 * Provides reusable functions for uploading files with progress tracking,
 * concurrency limiting, and hash-based deduplication.
 *
 * Used by:
 * - Static site file uploads (useStaticSiteGenerator.js)
 * - wp-content.zip uploads (useExportController.js)
 *
 */









/**
 * Sanitize a storage key for use in status message keys.
 *
 * @param {string} key Storage key.
 * @return {string} Sanitized key.
 */
function sanitizeKeyForStatus(key) {
  // Replace special characters that might cause issues in status keys
  return key.replace(/[^a-zA-Z0-9-_]/g, '-');
}

/**
 * Upload multiple files with progress tracking and concurrency limiting.
 *
 * @typedef {Object} FileUploadDescriptor
 * @property {string}                 key                           Storage key/path.
 * @property {Blob}                   blob                          File blob to upload.
 * @property {string}                 contentType                   MIME type.
 * @property {string}                 [displayName]                 Display name for progress messages (optional).
 * @property {Object}                 [metadata]                    Optional metadata object.
 *
 * @param    {Object}                 options                       Options object.
 * @param    {FileUploadDescriptor[]} options.files                 Array of file upload descriptors.
 * @param    {Object}                 options.storageService        StorageService instance.
 * @param    {Function}               options.setStatusMessage      Status message callback function.
 * @param    {number}                 [options.concurrency=5]       Max concurrent uploads (default: 5).
 * @param    {Function}               [options.onProgress]          Overall progress callback (optional).
 * @param    {string}                 [options.keyPrefix='upload']  Prefix for status message keys (default: 'upload').
 * @param    {boolean}                [options.skipHashCheck=false] Boolean to skip hash checking (default: false).
 * @param    {Object}                 [options.manifest]            Manifest object for hash checking (optional).
 * @param    {Function}               [options.shouldSkipUpload]    Custom function to determine if file should be skipped (optional).
 * @return {Promise<Object>} Result with success, uploaded, skipped, failed counts and results array.
 */
async function uploadFilesWithProgress({
  files,
  storageService,
  setStatusMessage,
  concurrency = 5,
  onProgress = null,
  keyPrefix = 'upload',
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null
}) {
  if (!files || files.length === 0) {
    return {
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      results: []
    };
  }
  const limiter = createConcurrencyLimiter(concurrency);
  let filesUploaded = 0;
  let filesSkipped = 0;
  let filesFailed = 0;
  let totalProcessed = 0; // Track total processed (uploaded + skipped) for progress
  const results = [];

  // Process all files in parallel with concurrency limiting
  const uploadPromises = files.map(file => limiter(async () => {
    const {
      key,
      blob,
      contentType,
      displayName: providedDisplayName,
      metadata = {}
    } = file;

    // Ensure displayName is never empty - fallback to key, then to 'file'
    const displayName = providedDisplayName || key || 'file';
    const uploadKey = `${keyPrefix}-${sanitizeKeyForStatus(key)}`;
    let fileHash = null;
    let shouldSkip = false;
    try {
      /**
       * Action fired before each file upload.
       *
       * @param {Object} fileData             File data object.
       * @param {string} fileData.key         Storage key.
       * @param {Blob}   fileData.blob        File blob.
       * @param {string} fileData.contentType Content type.
       * @param {string} fileData.displayName Display name.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.upload.file.before', 'my-provider', (fileData) => {
       *   console.log('About to upload:', fileData.key);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.upload.file.before', {
        key,
        blob,
        contentType,
        displayName
      });

      // Hash checking and skip logic (if enabled)
      if (!skipHashCheck && manifest) {
        const fileSize = blob.size;
        const existingEntry = manifest[key];
        if (existingEntry && existingEntry.size === fileSize) {
          // Stage 2: Calculate hash if size matches
          try {
            /**
             * Filter hash calculation for files.
             *
             * Allows providers to customize hash calculation or provide pre-calculated hash.
             *
             * @param {string|null} hash     Calculated hash or null to use default calculation.
             * @param {Blob}        blob     File blob.
             * @param {string}      key      Storage key.
             * @param {Object}      manifest Manifest object.
             *
             * @example
             * import { addFilter } from '@wordpress/hooks';
             *
             * addFilter('aether.upload.hash.calculate', 'my-provider', (hash, blob, key, manifest) => {
             *   // Return pre-calculated hash or null to use default
             *   if (key.startsWith('custom/')) {
             *     return 'pre-calculated-hash';
             *   }
             *   return hash; // Use default calculation
             * });
             */
            const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
            fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
            shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : manifestManager_shouldSkipUpload(manifest, key, fileSize, fileHash);
          } catch (error) {
            shouldSkip = false;
          }
        }
      }
      if (shouldSkip) {
        // File unchanged - skip upload
        filesSkipped++;
        totalProcessed++;
        const fileSize = blob.size;
        const sizeStr = formatFileSize(fileSize);
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,external_wp_i18n_namespaceObject.__)('Skipped unchanged file %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, undefined, {
            fileSize
          });
        }

        // Report progress (guard against empty array to prevent division by zero)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        results.push({
          key,
          success: true,
          skipped: true,
          url: null,
          hash: fileHash,
          // Include hash so skipped files can be added to manifest
          size: blob.size // Include size for consistency
        });
        return;
      }

      // Calculate hash if not already calculated (for manifest update)
      if (!fileHash && !skipHashCheck) {
        try {
          /**
           * Filter hash calculation for files (when not already calculated).
           *
           * Allows providers to customize hash calculation.
           *
           * @param {string|null} hash     Calculated hash or null to use default calculation.
           * @param {Blob}        blob     File blob.
           * @param {string}      key      Storage key.
           * @param {Object}      manifest Manifest object.
           */
          const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
          fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
        } catch (error) {
          fileHash = null;
        }
      }
      const fileSize = blob.size;
      const sizeStr = formatFileSize(fileSize);

      // Create status message with unique key for progress tracking
      if (setStatusMessage) {
        setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
        (0,external_wp_i18n_namespaceObject.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
          percent: 0,
          loaded: 0,
          total: fileSize
        }, {
          fileSize
        });
      }

      // Prepare upload options
      let uploadOptions = {
        contentType,
        cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
        onProgress: (loaded, total, percent) => {
          // Update progress in status message
          if (setStatusMessage) {
            setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
            (0,external_wp_i18n_namespaceObject.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
              percent,
              loaded,
              total
            }, {
              fileSize
            });
          }
        }
      };

      /**
       * Filter upload options before file upload.
       *
       * Allows providers to modify upload options (contentType, cacheControl, metadata, etc.).
       *
       * @param {Object} uploadOptions Upload options object.
       * @param {string} key           Storage key.
       * @param {Blob}   blob          File blob.
       * @param {string} contentType   Content type.
       * @param {Object} metadata      File metadata.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.upload.file.options', 'my-provider', (options, key, blob, contentType, metadata) => {
       *   return {
       *     ...options,
       *     cacheControl: 'public, max-age=86400',
       *     customHeader: 'value'
       *   };
       * });
       */
      uploadOptions = (0,external_wp_hooks_.applyFilters)('aether.upload.file.options', uploadOptions, key, blob, contentType, metadata);

      // Upload file with retry logic using ErrorHandler
      let uploadResult = null;
      try {
        uploadResult = await errorHandler.executeWithRetry(async () => {
          const result = await storageService.upload(key, blob, uploadOptions);

          // If upload returned failure, throw error for retry logic
          if (!result.success) {
            const error = new Error(result.error || 'Upload failed');
            error.code = result.code;
            error.status = result.status;
            throw error;
          }
          return result;
        }, {
          onRetry: (error, attempt) => {
            if (setStatusMessage) {
              setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
              (0,external_wp_i18n_namespaceObject.__)('Retrying %1$s (%2$s) - attempt %3$d/%4$d', 'aether-site-exporter'), displayName, sizeStr, attempt, 3), 'info', uploadKey, undefined, {
                fileSize
              });
            }
          }
        });
      } catch (error) {
        // Upload failed after all retries
        uploadResult = {
          success: false,
          error: errorHandler.formatMessage(error, {
            operation: `upload ${displayName}`
          })
        };
      }
      if (uploadResult && uploadResult.success) {
        filesUploaded++;
        totalProcessed++;

        // Update message to success (remove progress)
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,external_wp_i18n_namespaceObject.__)('Uploaded %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, null,
          // Remove progress
          {
            fileSize
          });
        }

        // Report progress after upload completes (guard against empty array)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        const uploadResultData = {
          key,
          success: true,
          skipped: false,
          url: uploadResult.url,
          hash: fileHash,
          size: fileSize
        };

        /**
         * Action fired after each file upload succeeds.
         *
         * @param {Object} result      Upload result object.
         * @param {string} result.key  Storage key.
         * @param {string} result.url  Uploaded file URL.
         * @param {string} result.hash File hash.
         * @param {number} result.size File size.
         * @param {string} displayName Display name.
         *
         * @example
         * import { addAction } from '@wordpress/hooks';
         *
         * addAction('aether.upload.file.after', 'my-provider', (result, displayName) => {
         *   console.log('File uploaded:', result.key, result.url);
         * });
         */
        (0,external_wp_hooks_.doAction)('aether.upload.file.after', uploadResultData, displayName);
        results.push(uploadResultData);
      } else {
        // Upload failed after all retries
        filesFailed++;
        const errorMessage = uploadResult?.error || 'Upload failed after retries';
        if (setStatusMessage) {
          setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File name */
          (0,external_wp_i18n_namespaceObject.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', uploadKey, null);
        }
        results.push({
          key,
          success: false,
          skipped: false,
          url: null,
          error: errorMessage
        });
      }
    } catch (error) {
      // Failed to process file
      filesFailed++;
      if (setStatusMessage) {
        setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File name */
        (0,external_wp_i18n_namespaceObject.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', uploadKey, null);
      }
      results.push({
        key,
        success: false,
        skipped: false,
        url: null,
        error: error.message || 'Upload failed'
      });
    }
  }));

  // Wait for all uploads to complete (success or failure)
  await Promise.allSettled(uploadPromises);
  return {
    success: filesFailed === 0,
    uploaded: filesUploaded,
    skipped: filesSkipped,
    failed: filesFailed,
    results
  };
}

/**
 * Upload a single file with progress tracking.
 *
 * @param {Object}   options                  Options object.
 * @param {string}   options.key              Storage key.
 * @param {Blob}     options.blob             File blob.
 * @param {Object}   options.storageService   StorageService instance.
 * @param {Function} options.setStatusMessage Status message callback.
 * @param {string}   options.contentType      MIME type.
 * @param {string}   options.displayName      Display name (optional, defaults to key).
 * @param {string}   options.statusKey        Unique key for status message (required).
 * @param {Function} options.onProgress       Progress callback (optional).
 * @param {boolean}  options.skipHashCheck    Boolean to skip hash checking (default: false).
 * @param {Object}   options.manifest         Manifest object (optional).
 * @param {Function} options.shouldSkipUpload Custom function to determine if file should be skipped (optional).
 * @param {Object}   options.metadata         Optional metadata object.
 * @return {Promise<Object>} Result with success, url, skipped, error.
 */
async function uploadSingleFileWithProgress({
  key,
  blob,
  storageService,
  setStatusMessage,
  contentType,
  displayName: providedDisplayName,
  statusKey,
  onProgress = null,
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null,
  metadata = {}
}) {
  if (!statusKey) {
    throw new Error('statusKey is required for uploadSingleFileWithProgress');
  }

  // Ensure displayName is never empty - fallback to key, then to 'file'
  const displayName = providedDisplayName || key || 'file';
  let fileHash = null;
  let shouldSkip = false;
  try {
    // Hash checking and skip logic (if enabled)
    if (!skipHashCheck && manifest) {
      const fileSize = blob.size;
      const existingEntry = manifest[key];
      if (existingEntry && existingEntry.size === fileSize) {
        // Stage 2: Calculate hash if size matches
        try {
          fileHash = await calculateFileHash(blob);
          shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : shouldSkipUpload(manifest, key, fileSize, fileHash);
        } catch (error) {
          shouldSkip = false;
        }
      }
    }
    if (shouldSkip) {
      // File unchanged - skip upload
      if (setStatusMessage) {
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setStatusMessage(sprintf(/* translators: %1$s: File name, %2$s: File size in MB */
        __('%1$s unchanged (%2$s MB) - skipping upload', 'aether-site-exporter'), displayName, fileSizeMB), 'success', statusKey);
      }
      return {
        success: true,
        url: null,
        skipped: true,
        error: null,
        hash: fileHash
      };
    }

    // Calculate hash if not already calculated (for manifest update)
    if (!fileHash && !skipHashCheck) {
      try {
        fileHash = await calculateFileHash(blob);
      } catch (error) {
        fileHash = null;
      }
    }
    const fileSize = blob.size;

    // Create status message with progress tracking
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
        percent: 0,
        loaded: 0,
        total: fileSize
      });
    }

    // Upload file with progress tracking
    const uploadResult = await storageService.upload(key, blob, {
      contentType,
      cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
      onProgress: (loaded, total, percent) => {
        // Update progress in status message
        if (setStatusMessage) {
          setStatusMessage(sprintf(/* translators: %s: File name */
          __('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
            percent,
            loaded,
            total
          });
        }

        // Call custom progress callback if provided
        if (onProgress) {
          onProgress(loaded, total, percent);
        }
      }
    });
    if (uploadResult.success) {
      // Update message to success (remove progress)
      if (setStatusMessage) {
        setStatusMessage(sprintf(/* translators: %s: File name */
        __('Uploaded %s', 'aether-site-exporter'), displayName), 'success', statusKey, null // Remove progress
        );
      }
      return {
        success: true,
        url: uploadResult.url,
        skipped: false,
        error: null,
        hash: fileHash,
        size: fileSize
      };
    }
    // Upload failed
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: uploadResult.error || __('Upload failed', 'aether-site-exporter'),
      hash: fileHash
    };
  } catch (error) {
    if (setStatusMessage) {
      setStatusMessage(sprintf(/* translators: %s: File name */
      __('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: error.message || 'Upload failed',
      hash: fileHash
    };
  }
}
;// ./assets/src/export/utils/uploadPhase.js
/**
 * Upload Phase
 *
 * Phase 2 of static site generation: Upload all files with accurate progress tracking.
 *
 */









/**
 * Fetch and prepare manifest for upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<Object>} Manifest object.
 */
async function prepareManifest(storageService, providerId, setStatusMessage) {
  let manifest = {};
  try {
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Fetching file manifest…', 'aether-site-exporter'), 'progress', 'fetchManifest');
    }
    manifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.fetch', null, storageService, providerId);
    if (manifest === null) {
      manifest = await fetchManifest(storageService);
    }
    const manifestEntryCount = Object.keys(manifest).length;
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: Number of manifest entries */
      (0,external_wp_i18n_namespaceObject.__)('Fetched file manifest (%d entries)', 'aether-site-exporter'), manifestEntryCount), 'success', 'fetchManifest');
    }
  } catch (error) {
    manifest = {};
  }
  return manifest;
}

/**
 * Process and upload assets for a given set of asset URLs.
 *
 * @param {Object}   options                    Upload options.
 * @param {Array}    options.assetUrls          Asset URLs to process.
 * @param {Object}   options.assetTracker       Asset tracker instance.
 * @param {Object}   options.storageService     Storage service instance.
 * @param {Object}   options.manifest           Manifest object.
 * @param {string}   options.providerId         Provider ID.
 * @param {number}   options.filesUploaded      Current files uploaded count.
 * @param {number}   options.totalFilesToUpload Total files to upload.
 * @param {Function} options.onProgress         Progress callback.
 * @param {Function} options.setStatusMessage   Status message updater.
 * @return {Promise<Object>} Updated counts and manifest.
 */
async function processAssets({
  assetUrls,
  assetTracker,
  storageService,
  manifest,
  providerId,
  filesUploaded,
  totalFilesToUpload,
  onProgress,
  setStatusMessage
}) {
  let currentFilesUploaded = filesUploaded;
  let filesSkipped = 0;
  const uploadedFiles = [];
  let currentManifest = manifest;

  // Filter out already processed assets
  const assetsNotInTracker = assetUrls.filter(assetUrl => !assetTracker.isUploaded(assetUrl));
  if (assetsNotInTracker.length === 0) {
    return {
      filesUploaded: currentFilesUploaded,
      filesSkipped,
      uploadedFiles,
      manifest: currentManifest
    };
  }

  // Fetch and prepare asset data
  const assetData = [];
  for (const assetUrl of assetsNotInTracker) {
    try {
      const assetResponse = await fetch(assetUrl, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (assetResponse.status !== 200) {
        continue;
      }
      const assetContent = await assetResponse.blob();
      const contentType = assetResponse.headers.get('content-type') || 'application/octet-stream';
      const assetPath = getAssetLocalPath(assetUrl);
      if (assetPath === null) {
        assetTracker.markFailed(assetUrl);
        continue;
      }
      const assetKey = assetPath;
      let assetBlob = new Blob([assetContent], {
        type: contentType
      });

      // Filter asset before processing
      const filteredAssetData = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.asset.process', {
        blob: assetBlob,
        path: assetPath,
        key: assetKey,
        contentType,
        url: assetUrl
      }, providerId);
      assetBlob = filteredAssetData.blob || assetBlob;
      const finalAssetPath = filteredAssetData.path || assetPath;
      const finalAssetKey = filteredAssetData.key || assetKey;
      const finalContentType = filteredAssetData.contentType || contentType;

      // Check manifest for skip
      const existingEntry = currentManifest[finalAssetKey];
      if (existingEntry && existingEntry.size === assetBlob.size) {
        try {
          const assetHash = await fileHash_calculateFileHash(assetBlob);
          if (manifestManager_shouldSkipUpload(currentManifest, finalAssetKey, assetBlob.size, assetHash)) {
            assetTracker.markUploaded(assetUrl);
            currentFilesUploaded++;
            filesSkipped++;
            uploadedFiles.push({
              storageKey: finalAssetKey,
              relativePath: finalAssetPath,
              contentType: finalContentType
            });
            continue;
          }
        } catch (error) {}
      }
      assetData.push({
        assetUrl,
        assetPath: finalAssetPath,
        assetKey: finalAssetKey,
        assetBlob,
        contentType: finalContentType
      });
    } catch (error) {}
  }

  // Prepare files for upload
  const filesToUpload = assetData.map(data => ({
    key: data.assetKey,
    blob: data.assetBlob,
    contentType: data.contentType,
    displayName: data.assetPath || data.assetKey || 'file',
    metadata: {},
    assetData: data
  }));

  // Upload in parallel
  const uploadResult = await uploadFilesWithProgress({
    files: filesToUpload,
    storageService,
    setStatusMessage,
    concurrency: 5,
    onProgress: uploaded => {
      if (onProgress) {
        onProgress(currentFilesUploaded + uploaded, totalFilesToUpload, null);
      }
    },
    keyPrefix: 'upload',
    skipHashCheck: false,
    manifest: currentManifest,
    shouldSkipUpload: manifestManager_shouldSkipUpload
  });

  // Process results
  for (const result of uploadResult.results) {
    const fileData = filesToUpload.find(f => f.key === result.key);
    if (!fileData) {
      continue;
    }
    const {
      assetUrl,
      assetPath,
      assetKey,
      contentType
    } = fileData.assetData;
    if (result.success) {
      assetTracker.markUploaded(assetUrl);
      currentFilesUploaded++;
      if (result.skipped) {
        filesSkipped++;
      }
      if (result.hash) {
        currentManifest = updateManifestEntry(currentManifest, assetKey, result.size || fileData.blob.size, result.hash, contentType);
        currentManifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.update', currentManifest, assetKey, providerId);
      }
      uploadedFiles.push({
        storageKey: assetKey,
        relativePath: assetPath,
        contentType
      });
    }
  }
  return {
    filesUploaded: currentFilesUploaded,
    filesSkipped,
    uploadedFiles,
    manifest: currentManifest
  };
}

/**
 * Upload a single HTML file.
 *
 * @param {Object}   options                  Upload options.
 * @param {string}   options.url              Page URL.
 * @param {string}   options.rawHtml          Raw HTML content.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.staticSiteUrl    Target static site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.storageService   Storage service instance.
 * @param {Object}   options.manifest         Manifest object.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Upload result.
 */
async function uploadHtmlFile({
  url,
  rawHtml,
  siteUrl,
  staticSiteUrl,
  providerId,
  storageService,
  manifest,
  setStatusMessage
}) {
  // Filter HTML before processing
  let processedHtml = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.html.process', rawHtml, url, siteUrl, staticSiteUrl, providerId);

  // Process HTML with URL rewriting
  processedHtml = processHtml(processedHtml, url, siteUrl, staticSiteUrl);
  const htmlPath = getStaticFilePath(url);
  const htmlKey = htmlPath;
  const htmlBlob = new Blob([processedHtml], {
    type: 'text/html'
  });
  const htmlSize = htmlBlob.size;
  let htmlHash = null;
  let shouldSkip = false;

  // Check manifest for skip
  const existingEntry = manifest[htmlKey];
  if (existingEntry && existingEntry.size === htmlSize) {
    try {
      htmlHash = await fileHash_calculateFileHash(htmlBlob);
      shouldSkip = manifestManager_shouldSkipUpload(manifest, htmlKey, htmlSize, htmlHash);
    } catch (error) {
      shouldSkip = false;
    }
  }
  if (shouldSkip) {
    return {
      success: true,
      skipped: true,
      htmlPath,
      htmlKey,
      htmlHash,
      htmlSize
    };
  }

  // Calculate hash if not already calculated
  if (!htmlHash) {
    try {
      htmlHash = await fileHash_calculateFileHash(htmlBlob);
    } catch (error) {
      htmlHash = null;
    }
  }

  // Upload status
  if (setStatusMessage) {
    setStatusMessage(`Uploading ${htmlPath}`, 'progress', `upload-${htmlPath}`);
  }
  const htmlUploadResult = await storageService.upload(htmlKey, htmlBlob, {
    contentType: 'text/html'
  });
  if (!htmlUploadResult.success) {
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Failed to upload HTML file: %s', 'aether-site-exporter'), htmlUploadResult.error));
  }
  if (setStatusMessage) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File path */
    (0,external_wp_i18n_namespaceObject.__)('Uploaded %s', 'aether-site-exporter'), htmlPath), 'success', `upload-${htmlPath}`);
  }
  return {
    success: true,
    skipped: false,
    htmlPath,
    htmlKey,
    htmlHash,
    htmlSize
  };
}

/**
 * Finalize manifest after upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {Object}   manifest         Manifest object.
 * @param {Array}    uploadedFiles    Array of uploaded file info.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<void>}
 */
async function finalizeManifest(storageService, manifest, uploadedFiles, providerId, setStatusMessage) {
  try {
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Updating file manifest…', 'aether-site-exporter'), 'progress', 'updateManifest');
    }
    const currentFileKeys = new Set(uploadedFiles.map(file => file.storageKey));
    let cleanedManifest = cleanupManifest(manifest, currentFileKeys);
    cleanedManifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.cleanup', cleanedManifest, currentFileKeys, providerId);
    await uploadManifest(storageService, cleanedManifest);
    if (setStatusMessage) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Updated file manifest', 'aether-site-exporter'), 'success', 'updateManifest');
    }
  } catch (error) {}
}
;// ./assets/src/export/hooks/useStaticSiteGenerator.js
/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *
 */






// Extracted modules




/**
 * Process URLs and upload static site files.
 *
 * @param {Function} onProgress Progress callback (uploadedFiles, totalFiles, message).
 * @return {Function} Process function.
 */
function useStaticSiteGenerator(onProgress) {
  const processUrls = (0,external_wp_element_namespaceObject.useCallback)(async (urls, staticSiteUrl, staticSiteProviderId, siteUrl, setStatusMessage, blueprintData, removeMessage = null, cache = null) => {
    // Validate provider ID is provided
    // CRITICAL: In multi-instance threading, each thread MUST use its own provider ID
    if (!staticSiteProviderId) {
      throw new Error('Static site provider ID is required. ' + 'This function must be called with a specific provider instance ID.');
    }

    // Create asset tracker to prevent duplicate uploads
    const assetTracker = createAssetTracker();

    // Track all uploaded files for manifest generation
    const uploadedFiles = [];

    // Track failures for reporting
    const failures = createFailureTracker();

    // Get provider configuration
    const providerConfig = await fetchProviderConfig(staticSiteProviderId);
    const staticPath = providerConfig.static_files_path || 'static/';

    // Build and create storage service
    const config = buildStorageConfig(siteUrl, staticSiteUrl, staticSiteProviderId);
    const storageService = await createStorageService(staticPath, config, staticSiteProviderId, providerConfig);
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs (use shared HTML data if provided)
    const preScanResult = await executePreScan({
      urls,
      siteUrl,
      providerId: staticSiteProviderId,
      providerConfig,
      setStatusMessage,
      htmlData: cache
    });
    const {
      htmlData: sharedHtmlData,
      totalFilesToUpload
    } = preScanResult;

    // Merge pre-scan failures
    failures.urlsFailed += preScanResult.failures.urlsFailed;
    failures.failedUrls.push(...preScanResult.failures.failedUrls);

    // PHASE 2: Upload all files
    let manifest = await prepareManifest(storageService, staticSiteProviderId, setStatusMessage);
    let filesUploaded = 0;
    let filesSkipped = 0;

    // Get URLs from HTML data storage
    const fetchedUrls = Array.from(sharedHtmlData.keys());

    // Validate that we have URLs to process
    if (fetchedUrls.length === 0) {
      throw new Error('No HTML data available for upload. Please ensure preScanStaticSite step completed successfully.');
    }

    // Fire upload start action
    (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.upload.before', fetchedUrls, totalFilesToUpload, staticSiteProviderId);

    // Process each URL
    for (const url of fetchedUrls) {
      const htmlDataEntry = sharedHtmlData.get(url);
      if (!htmlDataEntry) {
        continue;
      }

      // Validate data structure - expect { rawHtml, assetUrls } object
      if (typeof htmlDataEntry !== 'object' || htmlDataEntry === null) {
        continue;
      }
      if (!htmlDataEntry.rawHtml || !Array.isArray(htmlDataEntry.assetUrls)) {
        continue;
      }
      const {
        rawHtml,
        assetUrls
      } = htmlDataEntry;
      try {
        // Update progress message
        if (setStatusMessage) {
          setStatusMessage(`Uploading files (${filesUploaded + 1}/${totalFilesToUpload})`, 'progress', 'uploadFilesProgress');
        }

        // Upload HTML file
        const htmlResult = await uploadHtmlFile({
          url,
          rawHtml,
          siteUrl,
          staticSiteUrl,
          providerId: staticSiteProviderId,
          storageService,
          manifest,
          setStatusMessage
        });
        filesUploaded++;
        failures.urlsSucceeded++;
        if (htmlResult.skipped) {
          filesSkipped++;
          if (setStatusMessage) {
            setStatusMessage(`Skipped unchanged file ${htmlResult.htmlPath}`, 'success', `upload-${htmlResult.htmlPath}`);
          }
        }

        // Update manifest if hash available
        if (htmlResult.htmlHash && !htmlResult.skipped) {
          manifest = updateManifestEntry(manifest, htmlResult.htmlKey, htmlResult.htmlSize, htmlResult.htmlHash, 'text/html');
          manifest = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.manifest.update', manifest, htmlResult.htmlKey, staticSiteProviderId);
        }

        // Track uploaded file
        uploadedFiles.push({
          storageKey: htmlResult.htmlKey,
          relativePath: htmlResult.htmlPath,
          contentType: 'text/html'
        });

        // Report progress
        if (onProgress) {
          onProgress(filesUploaded, totalFilesToUpload, null);
        }

        // Process assets for this page
        const assetResult = await processAssets({
          assetUrls,
          assetTracker,
          storageService,
          manifest,
          providerId: staticSiteProviderId,
          filesUploaded,
          totalFilesToUpload,
          onProgress,
          setStatusMessage
        });
        filesUploaded = assetResult.filesUploaded;
        filesSkipped += assetResult.filesSkipped;
        uploadedFiles.push(...assetResult.uploadedFiles);
        manifest = assetResult.manifest;

        // Periodic manifest save
        if (filesUploaded % 50 === 0) {
          try {
            await uploadManifest(storageService, manifest);
          } catch (error) {
            // Manifest save failed, continue with upload
          }
        }
      } catch (error) {
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: error.message
        });
      }
    }

    // Note: HTML data cleanup is handled at the workflow level (uploadStaticFiles step)
    // to ensure it happens once for all providers, not per provider

    // Finalize manifest
    await finalizeManifest(storageService, manifest, uploadedFiles, staticSiteProviderId, setStatusMessage);

    // Remove progress message
    if (removeMessage) {
      removeMessage('uploadFilesProgress');
    }

    // Fire completion action
    (0,external_wp_hooks_.doAction)('aether.export.step.uploadStaticSiteFiles.upload.after', {
      filesUploaded,
      filesSkipped,
      urlsSucceeded: failures.urlsSucceeded,
      urlsFailed: failures.urlsFailed,
      assetsUploaded: assetTracker.getCount()
    }, staticSiteProviderId);

    // Return result
    return buildUploadResult(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls);
  }, [onProgress]);
  return processUrls;
}
;// ./assets/src/export/utils/blueprintStepBuilders.js
/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 */



/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * Uses 'bundled' resource type to reference wp-content.zip inside the blueprint-bundle.zip.
 *
 * @return {Object} Blueprint step object.
 */
function buildImportFilesStep() {
  return {
    step: 'importWordPressFiles',
    wordPressFilesZip: {
      resource: 'bundled',
      path: '/wp-content.zip'
    }
  };
}

/**
 * Build installPlugin steps for WordPress.org plugins.
 *
 * @param {Array<string>} pluginSlugs Array of WordPress.org plugin slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildPluginInstallSteps(pluginSlugs) {
  if (!Array.isArray(pluginSlugs)) {
    return [];
  }
  return pluginSlugs.map(slug => ({
    step: 'installPlugin',
    pluginData: {
      resource: 'wordpress.org/plugins',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build installTheme steps for WordPress.org themes.
 *
 * @param {Array<string>} themeSlugs Array of WordPress.org theme slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildThemeInstallSteps(themeSlugs) {
  if (!Array.isArray(themeSlugs)) {
    return [];
  }
  return themeSlugs.map(slug => ({
    step: 'installTheme',
    themeData: {
      resource: 'wordpress.org/themes',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build complete blueprint steps array.
 *
 * @param {Object} config              Configuration object.
 * @param {Array}  config.wporgPlugins WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes  WordPress.org theme slugs.
 * @return {Array<Object>} Complete array of blueprint steps.
 */
function buildBlueprintSteps(config) {
  const {
    wporgPlugins = [],
    wporgThemes = []
  } = config;
  const steps = [];

  // Step 1: Import WordPress files (wp-content.zip from bundle).
  steps.push(buildImportFilesStep());

  // Step 2: Install WordPress.org plugins.
  steps.push(...buildPluginInstallSteps(wporgPlugins));

  // Step 3: Install WordPress.org themes.
  steps.push(...buildThemeInstallSteps(wporgThemes));

  /**
   * Filter blueprint steps array.
   *
   * Allows modification of blueprint steps before final JSON generation.
   *
   * @param {Array<Object>} steps  Blueprint steps array.
   * @param {Object}        config Configuration object with wporgPlugins, wporgThemes.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.export.step.createBlueprintBundle.steps', 'my-plugin', (steps, config) => {
   *     // Add custom step at the end
   *     steps.push({
   *         step: 'runPHP',
   *         code: '<?php update_option("my_custom_option", "value"); ?>'
   *     });
   *     return steps;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.steps', steps, config);
}

/**
 * Build complete blueprint JSON object.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Complete blueprint JSON.
 */
function buildBlueprintJson(steps) {
  const blueprint = {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    landingPage: '/wp-login.php',
    preferredVersions: {
      php: '8.4',
      wp: 'latest'
    },
    features: {
      networking: true
    },
    steps
  };

  /**
   * Filter complete blueprint JSON object.
   *
   * Allows modification of the final blueprint configuration.
   *
   * @param {Object} blueprint Complete blueprint JSON object.
   * @param {Array}  steps     Blueprint steps array.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.export.step.createBlueprintBundle.json', 'my-plugin', (blueprint, steps) => {
   *     // Customize landing page
   *     blueprint.landingPage = '/wp-admin/';
   *
   *     // Change PHP version
   *     blueprint.preferredVersions.php = '8.3';
   *
   *     // Add login credentials
   *     blueprint.login = {
   *         username: 'admin',
   *         password: 'password'
   *     };
   *
   *     return blueprint;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.json', blueprint, steps);
}
;// ./assets/src/export/hooks/useBlueprintGenerator.js
/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 */






/**
 * Hook for generating WordPress Playground blueprint JSON.
 *
 * @return {Object} Object with generateBlueprint function.
 */
function useBlueprintGenerator() {
  const assetDiscovery = useAssetDiscovery();
  const generateBlueprint = (0,external_wp_element_namespaceObject.useCallback)(
  /**
   * Generate blueprint JSON.
   *
   * @param {Object}   [options]          Optional options object.
   * @param {Function} [setStatusMessage] Optional status message callback.
   * @return {Promise<Object>} Blueprint JSON object.
   */
  async (options = null, setStatusMessage = null) => {
    // Handle case where first argument is setStatusMessage (backwards compatibility).
    let actualSetStatusMessage;
    if (typeof options === 'function') {
      actualSetStatusMessage = options;
    } else {
      actualSetStatusMessage = setStatusMessage;
    }
    // Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Detecting WordPress.org plugins and themes…', 'progress', 'detectWporgAssets');
    }
    const assetsResponse = await assetDiscovery.getBlueprintAssets();
    let {
      plugins: wporgPlugins,
      themes: wporgThemes
    } = assetsResponse;

    /**
     * Filter discovered WordPress.org assets.
     *
     * Allows modification of detected plugins and themes before blueprint generation.
     *
     * @param {Object}        assets         Discovered assets object.
     * @param {Array<string>} assets.plugins WordPress.org plugin slugs.
     * @param {Array<string>} assets.themes  WordPress.org theme slugs.
     * @param {Object}        assetsResponse Full asset discovery response.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.export.step.createBlueprintBundle.assets', 'my-plugin', (assets) => {
     *     // Exclude specific plugins
     *     assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');
     *
     *     // Add additional plugins
     *     assets.plugins.push('my-required-plugin');
     *
     *     return assets;
     * });
     */
    const filteredAssets = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.assets', {
      plugins: wporgPlugins,
      themes: wporgThemes
    }, assetsResponse);
    wporgPlugins = filteredAssets.plugins || [];
    wporgThemes = filteredAssets.themes || [];

    // Start configuring Playground settings
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Configuring WordPress Playground settings…', 'progress', 'configurePlayground');
    }

    // Build blueprint steps array with bundled wp-content resources.
    const steps = buildBlueprintSteps({
      wporgPlugins,
      wporgThemes
    });

    // Construct blueprint JSON.
    let blueprint = buildBlueprintJson(steps);
    if (actualSetStatusMessage) {
      actualSetStatusMessage(`Blueprint generated: ${steps.length} total steps`, 'success', 'createBlueprintBundle');
      // Update detection message to success
      actualSetStatusMessage('Detected WordPress.org plugins and themes', 'success', 'detectWporgAssets');
      // Update configuration message to success
      actualSetStatusMessage('Configured WordPress Playground settings', 'success', 'configurePlayground');
      // Update plugin/theme messages to success
      // Keep original message text, just update type to success
      if (wporgPlugins.length > 0) {
        const pluginNames = wporgPlugins.join(', ');
        actualSetStatusMessage(`Adding ${wporgPlugins.length} WordPress.org plugin${wporgPlugins.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addPluginsToBlueprint');
        actualSetStatusMessage(`Plugins: ${pluginNames}`, 'success', 'pluginsList');
      }
      if (wporgThemes.length > 0) {
        const themeNames = wporgThemes.join(', ');
        actualSetStatusMessage(`Adding ${wporgThemes.length} WordPress.org theme${wporgThemes.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addThemesToBlueprint');
        actualSetStatusMessage(`Themes: ${themeNames}`, 'success', 'themesList');
      }
    }

    /**
     * Filter final generated blueprint.
     *
     * Allows final modification of blueprint before it's used for deployment.
     *
     * @param {Object}        blueprint    Complete blueprint JSON object.
     * @param {Array<string>} wporgPlugins WordPress.org plugin slugs.
     * @param {Array<string>} wporgThemes  WordPress.org theme slugs.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.export.step.createBlueprintBundle.generated', 'my-plugin', (blueprint) => {
     *     // Add custom metadata
     *     blueprint.description = 'My custom WordPress site';
     *
     *     return blueprint;
     * });
     */
    blueprint = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.generated', blueprint, wporgPlugins, wporgThemes);
    return blueprint;
  }, [assetDiscovery]);
  return {
    generateBlueprint
  };
}
;// ./assets/src/constants/deploymentTypes.js
/**
 * Deployment type constants and labels
 *
 */



/**
 * Deployment type identifiers
 */
const DEPLOYMENT_TYPES = {
  STATIC_SITE: 'static_site',
  BLUEPRINT_BUNDLE: 'blueprint_bundle',
  EDGE_FUNCTIONS: 'edge_functions'
};

/**
 * Human-readable labels for deployment types
 */
const DEPLOYMENT_TYPE_LABELS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
};
;// ./assets/src/export/executor/DataValidator.js
/**
 * Data Validator
 *
 * Validates data dependencies between workflow steps.
 * Ensures all required data exists before step execution
 * and validates output matches declared provides.
 *
 * Supports scope validation for multi-threaded execution:
 * - Global scope: Data shared across all threads (read-only)
 * - Thread scope: Data isolated to specific provider instance thread
 *
 * @since 1.0.0
 */



/**
 * Determine if a step is a per-thread step
 *
 * A step is per-thread if it requires data from 'thread' source.
 *
 * @param {Object} step - Step definition
 * @return {boolean} True if step is per-thread
 */
function isThreadStep(step) {
  if (!step.requires) {
    return false;
  }
  return Object.values(step.requires).some(requirement => requirement.from === 'thread');
}

/**
 * Get the scope of provided data
 *
 * @param {Object} step - Step definition
 * @param {string} key  - Data key
 * @return {string} 'global' or 'thread'
 */
function getProvideScope(step, key) {
  if (!step.provides || !(key in step.provides)) {
    return 'thread'; // Default to thread scope
  }
  const definition = step.provides[key];
  if (typeof definition !== 'object' || definition === null) {
    throw new Error(`Step "${step.id}" provides "${key}" with invalid format. Expected object with scope property.`);
  }
  return definition.scope || 'thread';
}

/**
 * Validate scope consistency
 *
 * Ensures that:
 * - Thread steps only provide thread-scoped data
 * - Global steps only provide global-scoped data
 * - No scope mismatches
 *
 * @param {Object} step - Step definition
 * @throws {Error} If scope is inconsistent
 */
function validateScope(step) {
  if (!step.provides) {
    return;
  }
  const isThread = isThreadStep(step);
  const errors = [];
  Object.entries(step.provides).forEach(([key]) => {
    const scope = getProvideScope(step, key);

    // Thread steps should only provide thread-scoped data
    if (isThread && scope === 'global') {
      errors.push(`"${key}" is declared as global scope but step "${step.id}" is a thread step`);
    }

    // Global steps should only provide global-scoped data
    if (!isThread && scope === 'thread') {
      errors.push(`"${key}" is declared as thread scope but step "${step.id}" is a global step`);
    }
  });
  if (errors.length > 0) {
    throw new Error(`Step "${step.id}" has scope inconsistencies:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Validate step data requirements
 *
 * Checks that all required data exists in context before step execution.
 *
 * @param {Object} step    - Step definition
 * @param {Object} context - Execution context
 * @throws {Error} If required data is missing
 */
function validate(step, context) {
  if (!step.requires) {
    return;
  }
  const missingDetails = [];
  Object.entries(step.requires).forEach(([key, requirement]) => {
    const isRequired = requirement.required !== false;
    if (!(key in context) && isRequired) {
      missingDetails.push(`  - "${key}" (from: ${requirement.from})`);
    }
  });
  if (missingDetails.length > 0) {
    throw new Error(`Step "${step.id}" is missing required data:\n${missingDetails.join('\n')}`);
  }
}

/**
 * Validate step output
 *
 * Checks that step handler returned all declared provides.
 *
 * @param {Object} step   - Step definition
 * @param {Object} result - Step handler result
 * @throws {Error} If provided data is missing
 */
function validateOutput(step, result) {
  if (!step.provides || !result) {
    return;
  }
  const missing = [];
  Object.keys(step.provides).forEach(key => {
    if (!(key in result)) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    throw new Error(`Step "${step.id}" did not provide declared outputs: ${missing.join(', ')}`);
  }
}

/**
 * Get data requirements summary
 *
 * Returns a human-readable summary of what data a step requires.
 *
 * @param {Object} step - Step definition
 * @return {string} Requirements summary
 */
function getRequirementsSummary(step) {
  if (!step.requires) {
    return (0,external_wp_i18n_namespaceObject.__)('No data requirements', 'aether-site-exporter');
  }
  const requirements = Object.entries(step.requires).map(([key, requirement]) => {
    const required = requirement.required !== false;
    const requiredLabel = required ? 'required' : 'optional';
    return `  - ${key} (from: ${requirement.from}, ${requiredLabel})`;
  });
  return requirements.join('\n');
}

/**
 * Get provides summary
 *
 * Returns a human-readable summary of what data a step provides.
 *
 * @param {Object} step - Step definition
 * @return {string} Provides summary
 */
function getProvidesSummary(step) {
  if (!step.provides) {
    return (0,external_wp_i18n_namespaceObject.__)('No data provided', 'aether-site-exporter');
  }
  const provides = Object.entries(step.provides).map(([key, definition]) => {
    if (typeof definition !== 'object' || definition === null) {
      throw new Error(`Step "${step.id}" provides "${key}" with invalid format. Expected object with type and scope properties.`);
    }
    const type = definition.type || 'unknown';
    const scope = definition.scope || 'thread';
    return `  - ${key} (type: ${type}, scope: ${scope})`;
  });
  return provides.join('\n');
}
/* harmony default export */ const DataValidator = ({
  validate,
  validateOutput,
  validateScope,
  isThreadStep,
  getProvideScope,
  getRequirementsSummary,
  getProvidesSummary
});
;// ./assets/src/export/executor/DependencyResolver.js
/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 */

/**
 * Build a parallel execution plan from steps with dependencies.
 *
 * Returns an array of arrays, where each inner array contains step IDs
 * that can be executed in parallel.
 *
 * @param {Array<Object>} steps Array of step definitions with id and dependencies.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function DependencyResolver_buildParallelPlan(steps) {
  const stepIds = new Set(steps.map(s => s.id));
  const remaining = new Set(stepIds);
  const result = [];
  while (remaining.size > 0) {
    // Find all steps whose dependencies are satisfied (not in remaining)
    const ready = [...remaining].filter(stepId => {
      const step = steps.find(s => s.id === stepId);
      const deps = step.dependencies || [];
      // All dependencies must be completed (not in remaining)
      return deps.every(depId => !remaining.has(depId));
    });
    if (ready.length === 0 && remaining.size > 0) {
      const unresolved = [...remaining].join(', ');
      throw new Error(`Circular dependency detected. Unresolved steps: ${unresolved}`);
    }

    // These steps can run in parallel
    result.push(ready);

    // Remove from remaining
    ready.forEach(id => remaining.delete(id));
  }
  return result;
}

/**
 * Validate step dependencies.
 *
 * Checks that all declared dependencies reference existing steps.
 *
 * @param {Array<Object>} allSteps     All step definitions (for dependency lookup).
 * @param {Array<Object>} stepsToCheck Steps to validate (defaults to allSteps).
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
function validateDependencies(allSteps, stepsToCheck = null) {
  const errors = [];
  const stepsToValidate = stepsToCheck || allSteps;
  const stepIds = new Set(allSteps.map(s => s.id));
  stepsToValidate.forEach(step => {
    const deps = step.dependencies || [];
    deps.forEach(depId => {
      if (!stepIds.has(depId)) {
        errors.push(`Step "${step.id}" depends on unknown step "${depId}"`);
      }
    });
  });
  return errors;
}

/**
 * Get execution order as a flat array.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Flat array of step IDs in execution order.
 */
function getExecutionOrder(steps) {
  const plan = DependencyResolver_buildParallelPlan(steps);
  return plan.flat();
}
;// ./assets/src/export/utils/progressTracker.js
/**
 * Progress Tracker Utility
 *
 * Tracks export workflow progress with equal step weights and IndexedDB persistence.
 * Each step gets equal weight: 100% / number of steps.
 *
 */


const DB_CONFIG = {
  dbName: 'aether-export-progress',
  version: 1,
  stores: {
    progress: {
      keyPath: 'workflowId'
    }
  }
};

// Initialize store instance
let storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function getStore() {
  if (!isIndexedDBAvailable()) {
    return null;
  }
  if (!storeInstance) {
    storeInstance = new utils_indexedDB('progress', DB_CONFIG);
  }
  return storeInstance;
}

/**
 * Save progress to IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @param {Object} progress   Progress data.
 * @return {Promise<void>}
 */
async function saveProgress(workflowId, progress) {
  const store = getStore();
  if (!store) {
    return; // Silently fail if IndexedDB unavailable
  }
  try {
    await store.set(workflowId, {
      ...progress,
      timestamp: Date.now()
    });
  } catch (error) {
    // Don't throw - progress tracking is non-critical
  }
}

/**
 * Load progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Object|null>} Progress data or null if not found.
 */
async function loadProgress(workflowId) {
  const store = getStore();
  if (!store) {
    return null;
  }
  try {
    const result = await store.get(workflowId);
    return result || null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete progress from IndexedDB.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<void>}
 */
async function deleteProgress(workflowId) {
  const store = getStore();
  if (!store) {
    return;
  }
  try {
    await store.delete(workflowId);
  } catch (error) {
    // Don't throw - cleanup is non-critical
  }
}

/**
 * Create a progress tracker instance.
 *
 * @param {string}        workflowId         Unique workflow identifier.
 * @param {Array<string>} stepIds            Array of step IDs in execution order.
 * @param {Function}      [onProgressChange] Callback when progress changes.
 * @return {Object} Progress tracker instance.
 */
function createProgressTracker(workflowId, stepIds, onProgressChange = null) {
  // Calculate equal step weight
  const stepWeight = stepIds.length > 0 ? 100 / stepIds.length : 0;

  // Initialize progress state
  let progressState = {
    workflowId,
    stepIds,
    stepWeight,
    stepProgress: {},
    overallProgress: 0,
    completedSteps: [],
    startedAt: Date.now(),
    updatedAt: Date.now()
  };

  /**
   * Update progress for a specific step.
   *
   * @param {string} stepId   Step identifier.
   * @param {number} progress Step progress (0-100).
   * @return {Promise<void>}
   */
  async function updateStepProgress(stepId, progress) {
    // Validate step ID
    if (!stepIds.includes(stepId)) {
      return;
    }

    // Clamp progress to 0-100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Update step progress
    progressState.stepProgress[stepId] = clampedProgress;
    progressState.updatedAt = Date.now();

    // Calculate overall progress
    // Sum of (stepWeight * stepProgress / 100) for all steps
    let totalProgress = 0;
    for (const id of stepIds) {
      const stepProg = progressState.stepProgress[id] || 0;
      totalProgress += stepWeight * stepProg / 100;
    }
    progressState.overallProgress = Math.min(100, Math.round(totalProgress));

    // Save to IndexedDB
    await saveProgress(workflowId, progressState);

    // Notify callback
    if (onProgressChange) {
      onProgressChange({
        stepId,
        stepProgress: clampedProgress,
        overallProgress: progressState.overallProgress,
        progressState
      });
    }
  }

  /**
   * Mark a step as completed.
   *
   * @param {string} stepId Step identifier.
   * @return {Promise<void>}
   */
  async function completeStep(stepId) {
    await updateStepProgress(stepId, 100);
    if (!progressState.completedSteps.includes(stepId)) {
      progressState.completedSteps.push(stepId);
      await saveProgress(workflowId, progressState);
    }
  }

  /**
   * Get current progress state.
   *
   * @return {Object} Progress state.
   */
  function getProgress() {
    return {
      ...progressState
    };
  }

  /**
   * Load progress from IndexedDB.
   *
   * @return {Promise<Object|null>} Progress state or null.
   */
  async function load() {
    const saved = await loadProgress(workflowId);
    if (saved) {
      progressState = {
        ...progressState,
        ...saved
      };
      return progressState;
    }
    return null;
  }

  /**
   * Clear progress from IndexedDB.
   *
   * @return {Promise<void>}
   */
  async function clear() {
    await deleteProgress(workflowId);
    progressState = {
      workflowId,
      stepIds,
      stepWeight,
      stepProgress: {},
      overallProgress: 0,
      completedSteps: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  return {
    updateStepProgress,
    completeStep,
    getProgress,
    load,
    clear
  };
}

/**
 * Calculate overall progress with equal step weights.
 *
 * @param {Array<string>} stepIds      Array of step IDs.
 * @param {Object}        stepProgress Object mapping step IDs to progress (0-100).
 * @return {number} Overall progress (0-100).
 */
function calculateOverallProgress(stepIds, stepProgress) {
  if (stepIds.length === 0) {
    return 0;
  }
  const stepWeight = 100 / stepIds.length;
  let totalProgress = 0;
  for (const stepId of stepIds) {
    const progress = stepProgress[stepId] || 0;
    totalProgress += stepWeight * progress / 100;
  }
  return Math.min(100, Math.round(totalProgress));
}
;// ./assets/src/export/utils/stateManager.js
/**
 * State Manager Utility
 *
 * Manages workflow state persistence using IndexedDB.
 * Uses a single database with provider instance keys for state isolation.
 * State is automatically saved and can be resumed after failures.
 *
 */


const stateManager_DB_CONFIG = {
  dbName: 'aether-export-state',
  version: 1,
  stores: {
    workflowState: {
      keyPath: 'stateKey',
      indexes: [{
        name: 'workflowId',
        keyPath: 'workflowId',
        unique: false
      }]
    }
  }
};

// Initialize store instance
let stateManager_storeInstance = null;

/**
 * Get or create IndexedDB store instance.
 *
 * @return {IndexedDBStore|null} Store instance or null if unavailable.
 */
function stateManager_getStore() {
  if (!isIndexedDBAvailable()) {
    return null;
  }
  if (!stateManager_storeInstance) {
    stateManager_storeInstance = new utils_indexedDB('workflowState', stateManager_DB_CONFIG);
  }
  return stateManager_storeInstance;
}

/**
 * Generate a state key from workflow ID and provider instance.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {string} State key.
 */
function generateStateKey(workflowId, providerInstance = null) {
  if (providerInstance) {
    return `${workflowId}::${providerInstance}`;
  }
  return workflowId;
}

/**
 * Save workflow state to IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {Object} state            State object to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
async function saveState(workflowId, state, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return; // Silently fail if IndexedDB unavailable
  }
  const stateKey = generateStateKey(workflowId, providerInstance);
  const stateData = {
    stateKey,
    workflowId,
    providerInstance: providerInstance || null,
    state,
    timestamp: Date.now()
  };
  try {
    await store.set(stateKey, stateData);
  } catch (error) {
    // Don't throw - state persistence is non-critical
  }
}

/**
 * Load workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object|null>} State object or null if not found.
 */
async function loadState(workflowId, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return null;
  }
  const stateKey = generateStateKey(workflowId, providerInstance);
  try {
    const result = await store.get(stateKey);
    if (result && result.state) {
      return result.state;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete workflow state from IndexedDB.
 *
 * @param {string} workflowId       Workflow identifier.
 * @param {string} providerInstance Provider instance ID (optional, null deletes all for workflow).
 * @return {Promise<void>}
 */
async function deleteState(workflowId, providerInstance = null) {
  const store = stateManager_getStore();
  if (!store) {
    return;
  }
  try {
    if (providerInstance) {
      // Delete specific provider instance state
      const stateKey = generateStateKey(workflowId, providerInstance);
      await store.delete(stateKey);
    } else {
      // Delete all states for this workflow
      // Get all states for this workflow using index
      const allStates = await store.getByIndex('workflowId', workflowId);

      // Delete each state
      for (const stateItem of allStates) {
        await store.delete(stateItem.stateKey);
      }
    }
  } catch (error) {
    // Don't throw - cleanup is non-critical
  }
}

/**
 * List all workflow states for a workflow ID.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Promise<Array<Object>>} Array of state objects.
 */
async function listStates(workflowId) {
  const store = stateManager_getStore();
  if (!store) {
    return [];
  }
  try {
    const allStates = await store.getByIndex('workflowId', workflowId);
    return allStates.map(stateItem => ({
      stateKey: stateItem.stateKey,
      providerInstance: stateItem.providerInstance,
      timestamp: stateItem.timestamp
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Create a state manager instance for a workflow.
 *
 * @param {string} workflowId Workflow identifier.
 * @return {Object} State manager instance.
 */
function createStateManager(workflowId) {
  /**
   * Save workflow state.
   *
   * @param {Object} state            State object to save.
   * @param {string} providerInstance Provider instance ID (optional).
   * @return {Promise<void>}
   */
  async function save(state, providerInstance = null) {
    await saveState(workflowId, state, providerInstance);
  }

  /**
   * Load workflow state.
   *
   * @param {string} providerInstance Provider instance ID (optional).
   * @return {Promise<Object|null>} State object or null.
   */
  async function load(providerInstance = null) {
    return await loadState(workflowId, providerInstance);
  }

  /**
   * Delete workflow state.
   *
   * @param {string} providerInstance Provider instance ID (optional, null deletes all).
   * @return {Promise<void>}
   */
  async function clear(providerInstance = null) {
    await deleteState(workflowId, providerInstance);
  }

  /**
   * List all states for this workflow.
   *
   * @return {Promise<Array<Object>>} Array of state metadata.
   */
  async function list() {
    return await listStates(workflowId);
  }
  return {
    save,
    load,
    clear,
    list
  };
}

/**
 * Save execution context state.
 *
 * This is a helper function that saves the relevant parts of the execution context.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} executionContext Execution context to save.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<void>}
 */
async function saveExecutionContext(stateManager, executionContext, providerInstance = null) {
  // Extract relevant state (exclude functions and non-serializable data)
  const stateToSave = {
    completedSteps: executionContext.completedSteps || [],
    skippedSteps: executionContext.skippedSteps || [],
    state: executionContext.state || {},
    // Save step results
    stepResults: {},
    // Save provider-specific data
    providers: {
      staticSiteProviders: executionContext.staticSiteProviders || [],
      blueprintBundleProviders: executionContext.blueprintBundleProviders || [],
      edgeFunctionProviders: executionContext.edgeFunctionProviders || []
    },
    // Save configuration
    siteUrl: executionContext.siteUrl,
    staticSiteUrl: executionContext.staticSiteUrl,
    blueprintData: executionContext.blueprintData
  };

  // Extract step results from state
  if (executionContext.state) {
    for (const [key, value] of Object.entries(executionContext.state)) {
      if (key.includes('Result') || key.includes('Bundle') || key.includes('Urls')) {
        stateToSave.stepResults[key] = value;
      }
    }
  }
  await stateManager.save(stateToSave, providerInstance);
}

/**
 * Restore execution context from saved state.
 *
 * @param {Object} stateManager     State manager instance.
 * @param {Object} baseContext      Base context to merge with.
 * @param {string} providerInstance Provider instance ID (optional).
 * @return {Promise<Object>} Restored execution context.
 */
async function restoreExecutionContext(stateManager, baseContext, providerInstance = null) {
  const savedState = await stateManager.load(providerInstance);
  if (!savedState) {
    return baseContext;
  }

  // Merge saved state into base context
  const restoredContext = {
    ...baseContext,
    completedSteps: savedState.completedSteps || [],
    skippedSteps: savedState.skippedSteps || [],
    state: {
      ...baseContext.state,
      ...savedState.state,
      ...savedState.stepResults
    }
  };

  // Restore provider arrays if available
  if (savedState.providers) {
    restoredContext.staticSiteProviders = savedState.providers.staticSiteProviders || baseContext.staticSiteProviders;
    restoredContext.blueprintBundleProviders = savedState.providers.blueprintBundleProviders || baseContext.blueprintBundleProviders;
    restoredContext.edgeFunctionProviders = savedState.providers.edgeFunctionProviders || baseContext.edgeFunctionProviders;
  }

  // Restore configuration
  if (savedState.siteUrl) {
    restoredContext.siteUrl = savedState.siteUrl;
  }
  if (savedState.staticSiteUrl) {
    restoredContext.staticSiteUrl = savedState.staticSiteUrl;
  }
  if (savedState.blueprintData) {
    restoredContext.blueprintData = savedState.blueprintData;
  }
  return restoredContext;
}
;// ./assets/src/export/executor/StepExecutor.js
/**
 * Step Executor
 *
 * Executes export workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 */








/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps              Array of step definitions to execute.
 * @param {Object}        context            Initial context with dependencies and state.
 * @param {Object}        options            Execution options.
 * @param {Array<Object>} [options.allSteps] Optional: All steps (for dependency validation when executing subset).
 * @return {Promise<Object>} Final execution state.
 */
async function executeSteps(steps, context, options = {}) {
  const {
    onStepStart = () => {},
    onStepComplete = () => {},
    onStepSkipped = () => {},
    onError = () => {},
    allSteps = null // Optional: All steps for dependency validation
  } = options;

  // Validate dependencies
  // Use allSteps if provided (for thread steps that depend on global steps),
  // otherwise use the steps array itself
  const stepsForValidation = allSteps || steps;
  const errors = validateDependencies(stepsForValidation, steps);
  if (errors.length > 0) {
    throw new Error(`Invalid step dependencies: ${errors.join('; ')}`);
  }

  // Build execution plan with parallel groups
  const executionPlan = DependencyResolver_buildParallelPlan(steps);

  // Get all step IDs in execution order
  const stepIds = steps.map(step => step.id);

  // Create workflow ID
  const workflowId = context.workflowId || `workflow-${Date.now()}`;

  // Create progress tracker with equal step weights
  const progressTracker = createProgressTracker(workflowId, stepIds);

  // Create state manager
  const stateManager = createStateManager(workflowId);

  // Try to restore previous state (for resume capability)
  let restoredState = null;
  try {
    const savedProgress = await progressTracker.load();
    if (savedProgress) {}

    // Try to restore execution context
    restoredState = await restoreExecutionContext(stateManager, context);
    if (restoredState && restoredState.completedSteps?.length > 0) {}
  } catch (error) {}

  // Create execution context (use restored state if available)
  const executionContext = {
    ...(restoredState || context),
    workflowId,
    progressTracker,
    stateManager,
    completedSteps: restoredState?.completedSteps || [],
    skippedSteps: restoredState?.skippedSteps || [],
    state: restoredState?.state || {}
  };

  // Fire workflow start action
  (0,external_wp_hooks_.doAction)('aether.export.workflow.before', executionContext, steps, executionContext.currentProviderInstance || null);
  try {
    for (const parallelGroup of executionPlan) {
      // Determine which steps to run vs skip
      const stepsToRun = [];
      const stepsToSkip = [];
      for (const stepId of parallelGroup) {
        const step = steps.find(s => s.id === stepId);
        const shouldSkip = (0,external_wp_hooks_.applyFilters)(`aether.export.step.${stepId}.skip`, step.skip ? step.skip(executionContext) : false, executionContext, executionContext.currentProviderInstance || null);
        if (shouldSkip) {
          stepsToSkip.push(stepId);
        } else {
          stepsToRun.push(stepId);
        }
      }

      // Mark skipped steps
      for (const stepId of stepsToSkip) {
        executionContext.skippedSteps.push(stepId);
        onStepSkipped(stepId);
        (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.skipped`, executionContext, executionContext.currentProviderInstance || null);
      }
      if (stepsToRun.length === 0) {
        continue;
      }

      // Execute steps in parallel
      const results = await Promise.all(stepsToRun.map(stepId => executeStep(stepId, steps, executionContext, {
        onStepStart,
        onStepComplete,
        onError
      })));

      // Merge results into state
      for (const result of results) {
        if (result) {
          Object.assign(executionContext.state, result);
        }
      }

      // Mark as completed
      executionContext.completedSteps.push(...stepsToRun);

      // Save state after each parallel group completes
      try {
        await saveExecutionContext(stateManager, executionContext);
      } catch (error) {
        // Don't throw - state saving is non-critical
      }
    }

    // Fire workflow complete action
    (0,external_wp_hooks_.doAction)('aether.export.workflow.after', executionContext.state, executionContext, executionContext.currentProviderInstance || null);

    // Clear progress tracker and state on successful completion
    await progressTracker.clear();
    await stateManager.clear();
    return executionContext.state;
  } catch (error) {
    (0,external_wp_hooks_.doAction)('aether.export.workflow.error', error, executionContext, executionContext.currentProviderInstance || null);
    // Don't clear progress on error - allows for resume
    throw error;
  }
}

/**
 * Execute a single step.
 *
 * @param {string}        stepId           Step ID to execute.
 * @param {Array<Object>} allSteps         All step definitions.
 * @param {Object}        executionContext Current execution context.
 * @param {Object}        options          Execution options.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep(stepId, allSteps, executionContext, options) {
  const step = allSteps.find(s => s.id === stepId);
  const {
    onStepStart,
    onStepComplete,
    onError
  } = options;

  // Fire before hook
  (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.before`, executionContext, executionContext.currentProviderInstance || null);
  onStepStart(stepId, step);

  // Initialize step progress to 0
  if (executionContext.progressTracker) {
    await executionContext.progressTracker.updateStepProgress(stepId, 0);
  }
  try {
    // Build context for this step (merge state into context)
    const stepContext = {
      ...executionContext,
      ...executionContext.state
    };

    // Validate data requirements before execution
    DataValidator.validate(step, stepContext);

    // Execute handler with retry logic
    const result = await errorHandler.executeWithRetry(async () => {
      return await step.handler(stepContext);
    }, {
      onRetry: (error, attempt, delay) => {
        // Fire retry action
        (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.retry`, error, attempt, delay, executionContext, executionContext.currentProviderInstance || null);
      }
    });

    // Validate output matches provides declaration
    DataValidator.validateOutput(step, result);

    // Apply result filter
    const filteredResult = (0,external_wp_hooks_.applyFilters)(`aether.export.step.${stepId}.result`, result || {}, executionContext, executionContext.currentProviderInstance || null);
    onStepComplete(stepId, filteredResult);

    // Mark step as completed in progress tracker
    if (executionContext.progressTracker) {
      await executionContext.progressTracker.completeStep(stepId);
    }

    // Fire after hook
    (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.after`, filteredResult, executionContext, executionContext.currentProviderInstance || null);
    return filteredResult;
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      // eslint-disable-next-line no-console
      console.error(`[Aether] StepExecutor - Step "${stepId}" failed:`, error);
      // eslint-disable-next-line no-console
      console.error('[Aether] Error details:', {
        message: error.message,
        stack: error.stack,
        stepId,
        providerInstance: executionContext.currentProviderInstance?.id || 'N/A'
      });
    }

    // Categorize and format error
    const category = errorHandler.categorize(error);
    const severity = determineSeverity(category, {
      stepId
    });
    const formattedMessage = formatErrorMessage(error, {
      stepId,
      operation: step.label || stepId
    });

    // Create enhanced error object
    const enhancedError = {
      ...error,
      category,
      severity,
      stepId,
      formattedMessage,
      originalMessage: error.message
    };
    onError(stepId, enhancedError);
    (0,external_wp_hooks_.doAction)(`aether.export.step.${stepId}.error`, enhancedError, executionContext, executionContext.currentProviderInstance || null);

    // For critical errors, stop workflow immediately
    if (severity === ERROR_SEVERITY.CRITICAL) {
      throw new Error(formattedMessage);
    }

    // For other errors, wrap with step context
    throw new Error(formattedMessage);
  }
}

/**
 * Get the parallel execution plan for steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function getExecutionPlan(steps) {
  return buildParallelPlan(steps);
}
;// ./assets/src/export/executor/ThreadOrchestrator.js
/**
 * Thread Orchestrator
 *
 * Orchestrates multi-threaded workflow execution where each provider instance
 * runs in its own isolated thread. Categorizes steps into global (run once)
 * and per-thread (run per provider instance), then executes them in parallel.
 *
 * @since 1.0.0
 */




/**
 * Keys in context that should be shared by reference (read-only across threads).
 * These are not cloned to allow threads to read the same data.
 */
const SHARED_READONLY_KEYS = ['sharedHtmlData'];

/**
 * Execute async functions with concurrency limit
 *
 * Limits number of concurrent executions to prevent resource exhaustion.
 * Uses a sliding window approach to maintain max concurrent executions.
 *
 * @param {Array}    items       - Array of items to process
 * @param {Function} fn          - Async function to call for each item
 * @param {number}   concurrency - Max concurrent executions (default: 5)
 * @return {Promise<Array>} Results array in original order
 */
async function limitConcurrency(items, fn, concurrency = 5) {
  const results = new Array(items.length);
  const executing = [];
  for (let index = 0; index < items.length; index++) {
    // Create promise for this item and wrap it with cleanup
    const promise = Promise.resolve(fn(items[index], index)).then(result => {
      // Store result in correct position
      results[index] = result;
      return result;
    });

    // Create cleanup promise that removes from executing array
    const cleanup = promise.then(() => {
      const execIndex = executing.indexOf(cleanup);
      if (execIndex !== -1) {
        executing.splice(execIndex, 1);
      }
    });

    // Add cleanup promise to executing array (not the original promise)
    executing.push(cleanup);

    // If we've hit concurrency limit, wait for one to complete
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining promises to complete
  await Promise.all(executing);
  return results;
}

/**
 * Deep clone global context to ensure thread isolation
 *
 * Creates a truly deep copy of global context so threads cannot mutate shared data.
 * Handles Maps, Arrays, and nested objects recursively.
 * Tracks visited objects to handle circular references.
 * Skips cloning keys specified in sharedKeys (passed by reference for read-only access).
 *
 * @param {Object}  context    Global context to clone
 * @param {WeakMap} visited    Internal: tracks cloned objects to handle circular refs
 * @param {Array}   sharedKeys Keys to skip cloning (passed by reference)
 * @return {Object} Deep cloned context
 */
function deepCloneContext(context, visited = new WeakMap(), sharedKeys = []) {
  // Handle primitives and null
  if (context === null || typeof context !== 'object') {
    return context;
  }

  // Check if already cloned (handles circular references)
  if (visited.has(context)) {
    return visited.get(context);
  }
  const cloned = {};
  // Mark this object as visited BEFORE recursing to handle circular references
  visited.set(context, cloned);
  for (const [key, value] of Object.entries(context)) {
    // Skip shared read-only keys - pass by reference
    if (sharedKeys.includes(key)) {
      cloned[key] = value;
      continue;
    }

    // Skip functions (callbacks are handled separately)
    if (typeof value === 'function') {
      continue;
    }

    // Handle null
    if (value === null) {
      cloned[key] = null;
      continue;
    }

    // Handle Map objects (deep clone entries, including keys)
    if (value instanceof Map) {
      const clonedMap = new Map();
      visited.set(value, clonedMap);
      for (const [mapKey, mapValue] of value.entries()) {
        // Recursively clone both keys and values
        const clonedKey = typeof mapKey === 'object' && mapKey !== null ? deepCloneValue(mapKey, visited, sharedKeys) : mapKey;
        const clonedValue = typeof mapValue === 'object' && mapValue !== null ? deepCloneValue(mapValue, visited, sharedKeys) : mapValue;
        clonedMap.set(clonedKey, clonedValue);
      }
      cloned[key] = clonedMap;
      continue;
    }

    // Handle Set objects (deep clone values)
    if (value instanceof Set) {
      const clonedSet = new Set();
      visited.set(value, clonedSet);
      for (const item of value.values()) {
        // Recursively clone set items
        const clonedItem = typeof item === 'object' && item !== null ? deepCloneValue(item, visited, sharedKeys) : item;
        clonedSet.add(clonedItem);
      }
      cloned[key] = clonedSet;
      continue;
    }

    // Handle Arrays (deep clone elements)
    if (Array.isArray(value)) {
      const clonedArray = [];
      visited.set(value, clonedArray);
      for (let i = 0; i < value.length; i++) {
        clonedArray[i] = typeof value[i] === 'object' && value[i] !== null ? deepCloneValue(value[i], visited) : value[i];
      }
      cloned[key] = clonedArray;
      continue;
    }

    // Handle plain objects (deep clone recursively)
    if (typeof value === 'object' && value.constructor === Object) {
      cloned[key] = deepCloneContext(value, visited, sharedKeys);
      continue;
    }

    // Handle Date objects
    if (value instanceof Date) {
      cloned[key] = new Date(value.getTime());
      continue;
    }

    // Handle RegExp objects
    if (value instanceof RegExp) {
      cloned[key] = new RegExp(value.source, value.flags);
      continue;
    }

    // Primitive values or unhandled types (e.g., DOM nodes)
    // For unhandled types, we keep the reference (can't clone everything)
    cloned[key] = value;
  }
  return cloned;
}

/**
 * Deep clone a single value (used by Map/Array cloning)
 *
 * @param {*}       value      Value to clone
 * @param {WeakMap} visited    Tracks cloned objects
 * @param {Array}   sharedKeys Keys to skip cloning (passed by reference)
 * @return {*} Cloned value
 */
function deepCloneValue(value, visited, sharedKeys = []) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (visited.has(value)) {
    return visited.get(value);
  }
  if (value instanceof Map) {
    const clonedMap = new Map();
    visited.set(value, clonedMap);
    for (const [k, v] of value.entries()) {
      // Clone both keys and values
      const clonedKey = typeof k === 'object' && k !== null ? deepCloneValue(k, visited, sharedKeys) : k;
      const clonedValue = typeof v === 'object' && v !== null ? deepCloneValue(v, visited, sharedKeys) : v;
      clonedMap.set(clonedKey, clonedValue);
    }
    return clonedMap;
  }
  if (value instanceof Set) {
    const clonedSet = new Set();
    visited.set(value, clonedSet);
    for (const item of value.values()) {
      const clonedItem = typeof item === 'object' && item !== null ? deepCloneValue(item, visited, sharedKeys) : item;
      clonedSet.add(clonedItem);
    }
    return clonedSet;
  }
  if (Array.isArray(value)) {
    const clonedArray = [];
    visited.set(value, clonedArray);
    for (let i = 0; i < value.length; i++) {
      clonedArray[i] = deepCloneValue(value[i], visited, sharedKeys);
    }
    return clonedArray;
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }
  if (typeof value === 'object' && value.constructor === Object) {
    return deepCloneContext(value, visited, sharedKeys);
  }

  // Unhandled types - return reference
  return value;
}

/**
 * Categorize steps into global and per-thread
 *
 * @param {Array} steps - All registered steps
 * @return {Object} { globalSteps: Array, threadSteps: Array }
 */
function categorizeSteps(steps) {
  const globalSteps = [];
  const threadSteps = [];
  steps.forEach(step => {
    if (isThreadStep(step)) {
      threadSteps.push(step);
    } else {
      globalSteps.push(step);
    }
  });
  return {
    globalSteps,
    threadSteps
  };
}

/**
 * Build thread context from global context and provider instance
 *
 * Creates an isolated thread context by deep cloning global context
 * and adding thread-specific properties.
 *
 * @param {Object} globalContext    - Global execution context
 * @param {Object} providerInstance - Provider instance object
 * @param {Object} callbacks        - Thread-specific callbacks
 * @return {Object} Thread context
 */
function buildThreadContext(globalContext, providerInstance, callbacks = {}) {
  // Validate provider instance
  if (!providerInstance || !providerInstance.id) {
    throw new Error('Invalid provider instance: missing id');
  }

  // Preserve function references before cloning (functions are skipped during clone)
  // These functions need to be preserved in thread context
  const preservedFunctions = {
    setStatusMessage: globalContext.setStatusMessage,
    setStepProgress: globalContext.setStepProgress,
    processStaticSiteUrls: globalContext.processStaticSiteUrls,
    generateBlueprintJson: globalContext.generateBlueprintJson,
    updateStaticSiteProgressContext: globalContext.updateStaticSiteProgressContext,
    assetManager: globalContext.assetManager,
    api: globalContext.api,
    removeMessage: globalContext.removeMessage,
    setOverallProgressValue: globalContext.setOverallProgressValue
  };

  // Deep clone global context to ensure thread isolation
  // Prevents threads from mutating shared data
  // Pass shared read-only keys by reference (not cloned)
  const clonedContext = deepCloneContext(globalContext, new WeakMap(), SHARED_READONLY_KEYS);

  // Add thread-specific properties
  return {
    ...clonedContext,
    currentProviderInstance: providerInstance,
    providerInstanceConfig: providerInstance.config || {},
    // Preserve function references (functions not cloned, need to be restored)
    setStatusMessage: callbacks.setStatusMessage || preservedFunctions.setStatusMessage,
    setStepProgress: callbacks.setStepProgress || preservedFunctions.setStepProgress,
    processStaticSiteUrls: preservedFunctions.processStaticSiteUrls,
    generateBlueprintJson: preservedFunctions.generateBlueprintJson,
    updateStaticSiteProgressContext: preservedFunctions.updateStaticSiteProgressContext,
    assetManager: preservedFunctions.assetManager,
    api: preservedFunctions.api,
    removeMessage: preservedFunctions.removeMessage,
    setOverallProgressValue: preservedFunctions.setOverallProgressValue
  };
}

/**
 * Execute workflow in multi-threaded mode
 *
 * Executes global steps first (once), then executes per-thread steps
 * in parallel for each provider instance.
 *
 * @param {Array}  steps             - All registered steps
 * @param {Object} initialContext    - Initial execution context
 * @param {Array}  providerInstances - Provider instances to execute in parallel
 * @param {Object} options           - Execution options
 * @return {Promise<Object>} Execution results
 */
async function executeThreadedWorkflow(steps, initialContext, providerInstances = [], options = {}) {
  // Categorize steps
  const {
    globalSteps,
    threadSteps
  } = categorizeSteps(steps);

  // Execute global steps first (run once, shared across all threads)
  let globalState = {};
  if (globalSteps.length > 0) {
    // executeSteps returns the execution state directly
    globalState = await executeSteps(globalSteps, initialContext, options);
  }

  // Build global context (initial + global step results)
  const globalContext = {
    ...initialContext,
    ...globalState
  };

  // Handle edge cases with providers and thread steps
  if (providerInstances.length === 0) {
    // If there are thread steps, this is an error condition
    // Thread steps need providers to execute
    if (threadSteps.length > 0) {
      const threadStepIds = threadSteps.map(s => s.id).join(', ');
      throw new Error(`No provider instances configured, but thread steps require execution: ${threadStepIds}. ` + `Please configure at least one provider instance or disable these steps.`);
    }

    // No thread steps and no providers - workflow completes successfully
    return {
      success: true,
      globalState,
      threadResults: [],
      successCount: 0,
      failureCount: 0
    };
  }

  // If there are providers but no thread steps, return early (nothing to do)
  if (threadSteps.length === 0) {
    return {
      success: true,
      globalState,
      threadResults: [],
      successCount: 0,
      failureCount: 0
    };
  }

  // Execute per-thread steps for each provider instance
  // Use concurrency limiting to prevent resource exhaustion
  // Default: 5 concurrent providers (configurable via options)
  const maxConcurrency = options.maxConcurrency || 5;

  // Create step label lookup map for performance (avoid repeated array searches)
  const stepLabelMap = new Map(threadSteps.map(step => [step.id, step.label]));
  const executeProviderThread = async providerInstance => {
    // Build thread-specific context
    const threadCallbacks = {
      setStatusMessage: (message, type, key, progress, metadata) => {
        // Add provider instance info to metadata
        const threadMetadata = {
          ...metadata,
          providerInstance: providerInstance.id,
          providerLabel: providerInstance.label || providerInstance.id
        };

        // Call original callback with thread info
        if (initialContext.setStatusMessage) {
          initialContext.setStatusMessage(message, type, key, progress, threadMetadata);
        }
      },
      setStepProgress: (stepId, progress) => {
        // Update step progress in context
        if (initialContext.setStepProgress) {
          initialContext.setStepProgress(stepId, progress);
        }

        // Update per-provider progress tracking
        if (initialContext.setProviderProgress) {
          // Get step label from cached map (O(1) lookup)
          const stepLabel = stepLabelMap.get(stepId) || stepId;
          initialContext.setProviderProgress(providerInstance.id, {
            stepId,
            stepLabel,
            progress,
            status: 'active'
          });
        }
      }
    };
    const threadContext = buildThreadContext(globalContext, providerInstance, threadCallbacks);

    // Execute thread steps for this provider instance
    try {
      // executeSteps returns the execution state directly
      // Pass all steps (global + thread) for dependency validation
      // since thread steps may depend on global steps
      const threadState = await executeSteps(threadSteps, threadContext, {
        ...options,
        allSteps: [...globalSteps, ...threadSteps]
      });

      // Mark provider as complete
      if (initialContext.setProviderProgress) {
        initialContext.setProviderProgress(providerInstance.id, {
          stepId: null,
          stepLabel: 'Complete',
          progress: {
            current: 100,
            total: 100
          },
          status: 'complete'
        });
      }
      return {
        success: true,
        providerInstance: providerInstance.id,
        state: threadState || {},
        error: null
      };
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        // eslint-disable-next-line no-console
        console.error('[Aether] ThreadOrchestrator - Thread execution failed for provider:', providerInstance.id, error);
        // eslint-disable-next-line no-console
        console.error('[Aether] Error stack:', error.stack);
      }

      // Mark provider as error
      if (initialContext.setProviderProgress) {
        initialContext.setProviderProgress(providerInstance.id, {
          stepId: null,
          stepLabel: 'Error',
          progress: {
            current: 0,
            total: 100
          },
          status: 'error',
          error: error.message || 'Unknown error'
        });
      }
      return {
        success: false,
        providerInstance: providerInstance.id,
        state: {},
        error: error.message || 'Unknown error'
      };
    }
  };

  // Execute provider threads with concurrency limiting
  const threadResults = await limitConcurrency(providerInstances, executeProviderThread, maxConcurrency);

  // Check if any threads succeeded
  const successfulThreads = threadResults.filter(r => r.success);
  const failedThreads = threadResults.filter(r => !r.success);

  // Determine overall success:
  // - All succeeded: complete success
  // - Some succeeded: partial success (workflow continues but with warnings)
  // - None succeeded: failure
  const allSucceeded = successfulThreads.length === threadResults.length;
  const someSucceeded = successfulThreads.length > 0;

  // Collect failed provider details for error reporting
  const failedProviders = failedThreads.map(r => ({
    providerId: r.providerInstance,
    error: r.error
  }));
  return {
    success: someSucceeded,
    // Succeeds if at least one provider worked
    partialSuccess: someSucceeded && !allSucceeded,
    // True if some failed
    allSucceeded,
    // True only if all providers succeeded
    globalState,
    threadResults,
    successCount: successfulThreads.length,
    failureCount: failedThreads.length,
    failedProviders // Array of {providerId, error} for failed providers
  };
}
/* harmony default export */ const ThreadOrchestrator = ({
  categorizeSteps,
  buildThreadContext,
  executeThreadedWorkflow
});
;// ./assets/src/export/registry/StepRegistry.js
/**
 * Step Registry
 *
 * Singleton registry for managing export workflow steps.
 * Steps register themselves dynamically via WordPress hooks.
 *
 * @since 1.0.0
 */



/**
 * Singleton instance
 */
let instance = null;

/**
 * Step Registry Class
 *
 * Manages registration and retrieval of export workflow steps.
 */
class StepRegistry {
  /**
   * Constructor
   *
   * Private constructor for singleton pattern.
   */
  constructor() {
    if (instance) {
      throw new Error('StepRegistry is a singleton. Use StepRegistry.getInstance()');
    }
    this.steps = [];
  }

  /**
   * Get singleton instance
   *
   * @return {StepRegistry} Singleton instance
   */
  static getInstance() {
    if (!instance) {
      instance = new StepRegistry();
    }
    return instance;
  }

  /**
   * Register a step
   *
   * Validates step structure and adds to registry.
   *
   * @param {Object}        step                          - Step definition
   * @param {string}        step.id                       - Unique step identifier
   * @param {string}        step.label                    - Display label (i18n)
   * @param {string}        [step.description]            - Step description (i18n)
   * @param {boolean}       [step.supportsProgress=false] - Whether step reports progress
   * @param {Array<string>} [step.dependencies=[]]        - IDs of steps this depends on
   * @param {Object}        step.requires                 - Data requirements (explicit dependencies)
   * @param {Object}        step.provides                 - Data this step provides
   * @param {Function}      step.handler                  - Async handler function
   * @param {Function}      [step.skip]                   - Optional skip function
   * @param {Function}      [step.shouldSkip]             - Optional skip function (alternative)
   * @throws {Error} If step is invalid
   */
  register(step) {
    // Validate required properties
    if (!step || typeof step !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must be an object', 'aether-site-exporter'));
    }
    if (!step.id || typeof step.id !== 'string') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid id (string)', 'aether-site-exporter'));
    }
    if (!step.label || typeof step.label !== 'string') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid label (string)', 'aether-site-exporter'));
    }
    if (!step.handler || typeof step.handler !== 'function') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid handler (function)', 'aether-site-exporter'));
    }
    if (!step.requires || typeof step.requires !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid requires object (data dependencies)', 'aether-site-exporter'));
    }
    if (!step.provides || typeof step.provides !== 'object') {
      throw new Error((0,external_wp_i18n_namespaceObject.__)('Step must have a valid provides object (output declaration)', 'aether-site-exporter'));
    }

    // Check for duplicate step ID
    if (this.steps.find(s => s.id === step.id)) {
      throw new Error(`Step with id "${step.id}" is already registered`);
    }

    // Set defaults for optional properties
    const normalizedStep = {
      ...step,
      description: step.description || '',
      supportsProgress: step.supportsProgress ?? false,
      dependencies: step.dependencies || []
    };

    // Add to registry
    this.steps.push(normalizedStep);
  }

  /**
   * Get all registered steps
   *
   * @return {Array<Object>} Registered steps
   */
  getSteps() {
    return this.steps;
  }

  /**
   * Clear all registered steps
   *
   * Used for re-initialization and testing.
   */
  clear() {
    this.steps = [];
  }

  /**
   * Get step by ID
   *
   * @param {string} stepId - Step identifier
   * @return {Object|null} Step definition or null if not found
   */
  getStepById(stepId) {
    return this.steps.find(step => step.id === stepId) || null;
  }

  /**
   * Check if step is registered
   *
   * @param {string} stepId - Step identifier
   * @return {boolean} True if step is registered
   */
  hasStep(stepId) {
    return this.steps.some(step => step.id === stepId);
  }
}
/* harmony default export */ const registry_StepRegistry = (StepRegistry);
;// ./assets/src/export/steps/discoverBlueprintBundleAssets/index.js
/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @since 1.0.0
 */




/**
 * Discover blueprint bundle assets step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with discovered assets
 */
async function handler(context) {
  const {
    api,
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Discovering plugins and themes…', 'aether-site-exporter'), 'progress', 'discoverBlueprintBundleAssets');

  // Call client-side asset discovery
  const discoveryResponse = await api.discoverBlueprintBundleAssets();
  if (!discoveryResponse.success) {
    throw new Error(discoveryResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to discover assets', 'aether-site-exporter'));
  }
  const assets = discoveryResponse.assets || [];
  const plugins = assets.filter(a => a.type === 'plugin');
  const themes = assets.filter(a => a.type === 'theme');

  // Build success message
  let message;
  if (assets.length === 0) {
    message = (0,external_wp_i18n_namespaceObject.__)('Discovered 0 active custom plugins/themes', 'aether-site-exporter');
  } else {
    const parts = [];
    if (plugins.length > 0) {
      const pluginText = plugins.length === 1 ? (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Plugin slug */
      (0,external_wp_i18n_namespaceObject.__)('1 active custom plugin (%s)', 'aether-site-exporter'), plugins[0].slug) : (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of plugins, %2$s: Comma-separated plugin slugs */
      (0,external_wp_i18n_namespaceObject._n)('%1$d active custom plugin (%2$s)', '%1$d active custom plugins (%2$s)', plugins.length, 'aether-site-exporter'), plugins.length, plugins.map(p => p.slug).join(', '));
      parts.push(pluginText);
    }
    if (themes.length > 0) {
      const themeText = themes.length === 1 ? (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Theme slug */
      (0,external_wp_i18n_namespaceObject.__)('1 active custom theme (%s)', 'aether-site-exporter'), themes[0].slug) : (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of themes, %2$s: Comma-separated theme slugs */
      (0,external_wp_i18n_namespaceObject._n)('%1$d active custom theme (%2$s)', '%1$d active custom themes (%2$s)', themes.length, 'aether-site-exporter'), themes.length, themes.map(t => t.slug).join(', '));
      parts.push(themeText);
    }
    message = (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Discovered assets description */
    (0,external_wp_i18n_namespaceObject.__)('Discovered %s. These will be included in the blueprint bundle.', 'aether-site-exporter'), parts.join((0,external_wp_i18n_namespaceObject.__)(' and ', 'aether-site-exporter')));
  }
  setStatusMessage(message, 'success', 'discoverBlueprintBundleAssets');

  // Return data to merge into execution state
  return {
    discoveredAssets: assets
  };
}

/**
 * Step definition
 */
const stepDefinition = {
  id: 'discoverBlueprintBundleAssets',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find custom plugins and themes for blueprint bundle', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    discoveredAssets: {
      type: 'array',
      scope: 'global'
    }
  },
  handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-discoverBlueprintBundleAssets', registry => {
  registry.register(stepDefinition);
}, 10);
;// ./assets/src/export/steps/getStaticSiteUrls/index.js
/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @since 1.0.0
 */




/**
 * Get static site URLs step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - PublishAPI instance
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with discovered URLs
 */
async function getStaticSiteUrls_handler(context) {
  const {
    api,
    siteUrl,
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Discovering URLs for static site…', 'aether-site-exporter'), 'progress', 'getStaticSiteUrls');

  // Discover URLs from API with progress updates
  const urlResponse = await api.discoverUrls(progress => {
    if (progress.status === 'fetching') {
      setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Type being fetched (posts, terms, etc.) */
      (0,external_wp_i18n_namespaceObject.__)('Fetching %s…', 'aether-site-exporter'), progress.type), 'progress', 'getStaticSiteUrls');
    }
  });
  if (!urlResponse.success) {
    throw new Error(urlResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to discover URLs', 'aether-site-exporter'));
  }
  const urls = urlResponse.urls || [];
  const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
  const urlsCount = urls.length;
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: Number of URLs */
  (0,external_wp_i18n_namespaceObject.__)('Discovered %d URLs for static site generation', 'aether-site-exporter'), urlsCount), 'success', 'getStaticSiteUrls');

  // Return data to merge into execution state
  return {
    urls,
    staticSiteUrl,
    urlsCount
  };
}

/**
 * Step definition
 */
const getStaticSiteUrls_stepDefinition = {
  id: 'getStaticSiteUrls',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover URLs', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Find all URLs for static site generation', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    urls: {
      type: 'array',
      scope: 'global'
    },
    staticSiteUrl: {
      type: 'string',
      scope: 'global'
    },
    urlsCount: {
      type: 'number',
      scope: 'global'
    }
  },
  handler: getStaticSiteUrls_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-getStaticSiteUrls', registry => {
  registry.register(getStaticSiteUrls_stepDefinition);
}, 10);
;// ./assets/src/export/utils/linkExtractor.js
/**
 * Link Extractor
 *
 * Extracts internal page links from HTML content for crawl-based URL discovery.
 * Uses parse5 for robust HTML parsing instead of regex.
 *
 */




/**
 * Lazy-loaded parse5 module.
 */
let parse5Module = null;

/**
 * Load parse5 module lazily.
 *
 * @return {Promise<Object>} parse5 module.
 */
async function loadParse5() {
  if (parse5Module) {
    return parse5Module;
  }
  parse5Module = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 212));
  return parse5Module;
}

/**
 * Hardcoded exclusions for internal links (NOT assets).
 * Assets from these paths are still valid and collected by assetExtractor.
 */
const LINK_EXCLUSIONS = ['/wp-admin/', '/wp-login.php', '/wp-json/', '?preview=true', '?s=',
// Search results
'/feed/', '/comments/feed/', '/trackback/', '/xmlrpc.php', '/wp-cron.php', '/wp-comments-post.php'];

/**
 * Asset file extensions to skip (these are handled by assetExtractor).
 */
const ASSET_EXTENSIONS = ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.pdf', '.zip', '.mp3', '.mp4', '.webm', '.ogg', '.wav', '.avi', '.mov', '.wmv', '.flv', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.xml', '.json'];

/**
 * Walk DOM tree and execute callback on each node.
 *
 * @param {Object}   node     DOM node.
 * @param {Function} callback Callback function.
 */
function walkTree(node, callback) {
  callback(node);
  if (node.childNodes) {
    for (const child of node.childNodes) {
      walkTree(child, callback);
    }
  }
}

/**
 * Extract internal page links from HTML content.
 *
 * @param {string} html    HTML content to parse.
 * @param {string} pageUrl Current page URL for resolving relative URLs.
 * @param {string} siteUrl Site base URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of internal page URLs.
 */
async function extractInternalLinks(html, pageUrl, siteUrl) {
  const links = new Set();
  const parse5 = await loadParse5();
  const document = parse5.parse(html);
  walkTree(document, node => {
    if (node.nodeName !== 'a') {
      return;
    }
    const hrefAttr = node.attrs?.find(attr => attr.name === 'href');
    if (!hrefAttr) {
      return;
    }
    const href = hrefAttr.value;

    // Skip non-URL hrefs
    if (shouldSkipHref(href)) {
      return;
    }

    // Resolve relative URLs to absolute
    const resolvedUrl = resolveRelative(href, pageUrl);

    // Skip external URLs
    if (isExternal(resolvedUrl, siteUrl)) {
      return;
    }

    // Skip excluded paths (wp-admin, feeds, etc.)
    if (isExcludedLink(resolvedUrl)) {
      return;
    }

    // Skip asset files (handled by assetExtractor)
    if (isAssetUrl(resolvedUrl)) {
      return;
    }

    // Normalize and add to set
    const normalizedUrl = normalize(resolvedUrl, siteUrl);
    if (normalizedUrl) {
      links.add(normalizedUrl);
    }
  });
  return (0,external_wp_hooks_.applyFilters)('aether.links.extracted', Array.from(links), html, pageUrl, siteUrl);
}

/**
 * Check if href should be skipped entirely.
 *
 * @param {string} href Href value to check.
 * @return {boolean} True if should skip.
 */
function shouldSkipHref(href) {
  return !href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:') || href.startsWith('blob:');
}

/**
 * Check if URL matches exclusion patterns for links.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedLink(url) {
  const lowerUrl = url.toLowerCase();
  for (const pattern of LINK_EXCLUSIONS) {
    if (lowerUrl.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Check if URL points to an asset file (not a page).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL is an asset file.
 */
function isAssetUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check for asset extensions
    for (const ext of ASSET_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return true;
      }
    }
    return false;
  } catch {
    // If URL parsing fails, check the string directly
    const lowerUrl = url.toLowerCase();
    for (const ext of ASSET_EXTENSIONS) {
      if (lowerUrl.includes(ext + '?') || lowerUrl.endsWith(ext)) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Check if a URL is likely a page URL (not an asset).
 * Exported for use by other modules.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL is likely a page.
 */
function isLikelyPageUrl(url) {
  return !isAssetUrl(url);
}

/**
 * Check if a URL should be excluded from crawling.
 * Exported for use by other modules.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedFromCrawl(url) {
  return isExcludedLink(url);
}
;// ./assets/src/export/steps/preScanStaticSite/index.js
/**
 * Pre-Scan Static Site Step
 *
 * Fetches HTML pages, extracts assets (CSS, JS, images), and discovers
 * internal links for crawl-based URL discovery.
 *
 * @since 1.0.0
 */







/**
 * Pre-scan static site step handler
 *
 * Uses crawl-based discovery to find all pages and assets.
 * Starts with seed URLs from PHP, then discovers additional URLs
 * by extracting internal links from each scanned page.
 *
 * @param {Object}   context                  - Execution context
 * @param {Array}    context.urls             - Seed URLs from getStaticSiteUrls
 * @param {string}   context.siteUrl          - WordPress site URL
 * @param {Function} context.setStatusMessage - Status message updater
 * @param {Function} context.setStepProgress  - Step progress updater
 * @return {Promise<Object>} Step result with expanded URL list including assets
 */
async function preScanStaticSite_handler(context) {
  const {
    urls,
    siteUrl,
    setStatusMessage,
    setStepProgress
  } = context;
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Scanning pages and discovering links…', 'aether-site-exporter'), 'progress', 'preScanStaticSite');

  // Track all URLs
  const discoveredUrls = new Set(urls.map(u => normalize(u, siteUrl)));
  const processedUrls = new Set();
  const pendingUrls = [...urls];
  const sharedHtmlData = new Map();
  const allAssets = new Set();
  let processedCount = 0;

  // Process URLs in a crawl-like fashion
  while (pendingUrls.length > 0) {
    const url = pendingUrls.shift();
    const normalizedUrl = normalize(url, siteUrl);

    // Skip if already processed
    if (processedUrls.has(normalizedUrl)) {
      continue;
    }
    processedUrls.add(normalizedUrl);
    processedCount++;

    // Update progress
    if (setStepProgress) {
      setStepProgress('preScanStaticSite', {
        current: processedCount,
        total: discoveredUrls.size,
        pending: pendingUrls.length
      });
    }

    // Update status message periodically
    if (processedCount % 10 === 0) {
      setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Pages scanned, %2$d: Total discovered */
      (0,external_wp_i18n_namespaceObject.__)('Scanned %1$d pages, discovered %2$d URLs…', 'aether-site-exporter'), processedCount, discoveredUrls.size), 'progress', 'preScanStaticSite');
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (!response.ok) {
        continue;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        // Not HTML, skip processing
        continue;
      }
      const html = await response.text();

      // Extract assets from HTML (CSS, JS, images, fonts)
      const assets = await extractAssetsFromHtml(html, url, siteUrl);
      for (const asset of assets) {
        allAssets.add(asset);
      }

      // Extract internal links for crawl-based discovery
      // This also captures pagination links (/page/2/, /page/3/, etc.)
      const internalLinks = await extractInternalLinks(html, url, siteUrl);
      for (const link of internalLinks) {
        const normalizedLink = normalize(link, siteUrl);
        if (normalizedLink && !discoveredUrls.has(normalizedLink) && !processedUrls.has(normalizedLink)) {
          discoveredUrls.add(normalizedLink);
          pendingUrls.push(link);
        }
      }

      // Store HTML and assets in shared cache for later use
      sharedHtmlData.set(normalizedUrl, {
        rawHtml: html,
        assetUrls: assets
      });
    } catch (error) {
      // Continue on fetch errors
    }
  }

  // Combine processed page URLs with discovered assets
  const expandedUrls = [...processedUrls, ...allAssets];
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Number of pages, %2$d: Number of assets */
  (0,external_wp_i18n_namespaceObject.__)('Found %1$d pages and %2$d assets', 'aether-site-exporter'), processedUrls.size, allAssets.size), 'success', 'preScanStaticSite');

  // Return expanded URL list and shared HTML cache
  return {
    urls: expandedUrls,
    htmlCount: processedUrls.size,
    assetCount: allAssets.size,
    sharedHtmlData
  };
}

/**
 * Step definition
 */
const preScanStaticSite_stepDefinition = {
  id: 'preScanStaticSite',
  label: (0,external_wp_i18n_namespaceObject.__)('Scan for Assets', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Discover pages, CSS, JS, and image assets', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['getStaticSiteUrls'],
  requires: {
    urls: {
      from: 'getStaticSiteUrls',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    setStepProgress: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    urls: {
      type: 'array',
      scope: 'global'
    },
    htmlCount: {
      type: 'number',
      scope: 'global'
    },
    assetCount: {
      type: 'number',
      scope: 'global'
    },
    sharedHtmlData: {
      type: 'Map',
      scope: 'global'
    }
  },
  handler: preScanStaticSite_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-preScanStaticSite', registry => {
  registry.register(preScanStaticSite_stepDefinition);
}, 10);
;// ./assets/src/export/steps/createWpContentArchive/index.js
/**
 * Create WP Content Archive Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @since 1.0.0
 */





/**
 * Create wp-content archive step handler
 *
 * @param {Object}   context                  - Execution context
 * @param {Object}   context.api              - ExportAPI instance
 * @param {Object}   context.assetManager     - Asset manager instance
 * @param {Array}    context.discoveredAssets - Discovered assets from discoverBlueprintBundleAssets step
 * @param {Function} context.setStatusMessage - Status message updater
 * @return {Promise<Object>} Step result with archive info
 */
async function createWpContentArchive_handler(context) {
  const {
    api,
    assetManager,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Creating wp-content archive…', 'aether-site-exporter'), 'progress', 'createWpContentArchive');

  // Determine which files to include
  const filesToInclude = (0,external_wp_hooks_.applyFilters)('aether.export.step.createWpContentArchive.files', discoveredAssets, context);

  // Create the archive via API
  const archiveResponse = await api.createArchive({
    assets: filesToInclude,
    includeUploads: true
  });
  if (!archiveResponse.success) {
    throw new Error(archiveResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to create wp-content archive', 'aether-site-exporter'));
  }
  const {
    zipPath,
    zipUrl,
    zipSize
  } = archiveResponse;
  const sizeFormatted = formatFileSize(zipSize || 0);

  // Update asset manager if provided and method exists
  if (assetManager && zipPath && typeof assetManager.setArchivePath === 'function') {
    assetManager.setArchivePath(zipPath);
  }
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Created wp-content archive (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'createWpContentArchive');

  // Return data to merge into execution state
  return {
    zipPath,
    zipUrl,
    zipSize
  };
}

/**
 * Step definition
 */
const createWpContentArchive_stepDefinition = {
  id: 'createWpContentArchive',
  label: (0,external_wp_i18n_namespaceObject.__)('Create WP Content Archive', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Package custom plugins, themes, and uploads', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['discoverBlueprintBundleAssets'],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    discoveredAssets: {
      from: 'discoverBlueprintBundleAssets',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    assetManager: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    zipPath: {
      type: 'string',
      scope: 'global'
    },
    zipUrl: {
      type: 'string',
      scope: 'global'
    },
    zipSize: {
      type: 'number',
      scope: 'global'
    }
  },
  handler: createWpContentArchive_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-createWpContentArchive', registry => {
  registry.register(createWpContentArchive_stepDefinition);
}, 10);
;// ./assets/src/export/steps/createBlueprintBundle/index.js
/**
 * Create Blueprint Bundle Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @since 1.0.0
 */





/**
 * Create blueprint bundle step handler
 *
 * @param {Object}   context                       - Execution context
 * @param {Object}   context.api                   - ExportAPI instance
 * @param {Function} context.generateBlueprintJson - Blueprint JSON generator function
 * @param {string}   context.zipPath               - Path to wp-content.zip from createWpContentArchive
 * @param {string}   context.zipUrl                - URL to wp-content.zip
 * @param {Array}    context.discoveredAssets      - Discovered assets
 * @param {Function} context.setStatusMessage      - Status message updater
 * @return {Promise<Object>} Step result with blueprint bundle info
 */
async function createBlueprintBundle_handler(context) {
  const {
    api,
    generateBlueprintJson,
    zipPath,
    zipUrl,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,external_wp_i18n_namespaceObject.__)('Creating blueprint bundle…', 'aether-site-exporter'), 'progress', 'createBlueprintBundle');
  if (!zipPath) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Site archive not found. Please run createWpContentArchive first.', 'aether-site-exporter'));
  }

  // Generate blueprint.json
  let blueprintData;
  if (typeof generateBlueprintJson === 'function') {
    blueprintData = await generateBlueprintJson({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    }, setStatusMessage);
  } else {
    // Fallback: use API to generate blueprint
    const blueprintResponse = await api.generateBlueprint({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    });
    if (!blueprintResponse.success) {
      throw new Error(blueprintResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to generate blueprint', 'aether-site-exporter'));
    }
    blueprintData = blueprintResponse.blueprint;
  }

  // Allow filtering of blueprint data (JSON only)
  const filteredBlueprint = (0,external_wp_hooks_.applyFilters)('aether.export.step.createBlueprintBundle.blueprintData', blueprintData, context);

  // Create the blueprint-bundle.zip via API
  const bundleResponse = await api.createBlueprintBundle({
    blueprint: filteredBlueprint,
    wpContentZipPath: zipPath
  });
  if (!bundleResponse.success) {
    throw new Error(bundleResponse.message || (0,external_wp_i18n_namespaceObject.__)('Failed to create blueprint bundle', 'aether-site-exporter'));
  }
  const {
    bundlePath,
    bundleUrl,
    bundleSize
  } = bundleResponse;
  const sizeFormatted = formatFileSize(bundleSize || 0);
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Created blueprint bundle (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'createBlueprintBundle');

  // Return data to merge into execution state
  return {
    blueprintData: filteredBlueprint,
    blueprintBundle: {
      bundlePath,
      bundleUrl,
      bundleSize
    }
  };
}

/**
 * Step definition
 */
const createBlueprintBundle_stepDefinition = {
  id: 'createBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Create Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Create blueprint-bundle.zip', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: ['createWpContentArchive'],
  requires: {
    api: {
      from: 'initial',
      required: true
    },
    generateBlueprintJson: {
      from: 'initial',
      required: true
    },
    zipPath: {
      from: 'createWpContentArchive',
      required: true
    },
    zipUrl: {
      from: 'createWpContentArchive',
      required: true
    },
    discoveredAssets: {
      from: 'discoverBlueprintBundleAssets',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    }
  },
  provides: {
    blueprintData: {
      type: 'object',
      scope: 'global'
    },
    blueprintBundle: {
      type: 'object',
      scope: 'global'
    }
  },
  handler: createBlueprintBundle_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-createBlueprintBundle', registry => {
  registry.register(createBlueprintBundle_stepDefinition);
}, 10);
;// ./assets/src/providers/registry/ProviderRegistry.js
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 */



/**
 * Internal registry storage.
 *
 * @type {Map<string, Function>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider classes.
 */
class ProviderRegistry {
  /**
   * Register a provider class.
   *
   * @param {string}   providerId    Provider ID
   * @param {Function} ProviderClass Provider class (must have static ID, NAME, etc.)
   * @return {void}
   */
  register(providerId, ProviderClass) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ProviderRegistry.register() requires a valid provider ID string');
    }
    if (!ProviderClass || typeof ProviderClass !== 'function') {
      throw new Error('ProviderRegistry.register() requires a provider class');
    }

    // Validate provider has required static properties
    if (!ProviderClass.ID) {
      throw new Error(`Provider ${providerId} must have static ID property`);
    }
    if (!ProviderClass.NAME) {
      throw new Error(`Provider ${providerId} must have static NAME property`);
    }
    providers.set(providerId, ProviderClass);

    /**
     * Action fired after a provider is registered.
     *
     * @param {string}   providerId    Provider ID
     * @param {Function} ProviderClass Provider class
     */
    (0,external_wp_hooks_.doAction)('aether.providers.registered', providerId, ProviderClass);
  }

  /**
   * Get a provider class by ID.
   *
   * @param {string} providerId Provider ID
   * @return {Function|null} Provider class or null if not found
   */
  get(providerId) {
    return providers.get(providerId) || null;
  }

  /**
   * Get all registered provider classes.
   *
   * @return {Array<Function>} Array of provider classes
   */
  getAll() {
    return Array.from(providers.values());
  }

  /**
   * Get all provider IDs.
   *
   * @return {Array<string>} Array of provider IDs
   */
  getAllIds() {
    return Array.from(providers.keys());
  }

  /**
   * Get providers that support a specific deployment type.
   *
   * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
   * @return {Array<Function>} Array of provider classes that support the deployment type
   */
  getByDeploymentType(deploymentType) {
    return this.getAll().filter(ProviderClass => {
      return ProviderClass.DEPLOYMENT_TYPE === deploymentType;
    });
  }

  /**
   * Get default provider.
   *
   * Returns the first provider that supports static_site deployment,
   * or the first registered provider if none found.
   *
   * @return {Function|null} Default provider class or null if none registered
   */
  getDefault() {
    const staticSiteProviders = this.getByDeploymentType('static_site');
    if (staticSiteProviders.length > 0) {
      return staticSiteProviders[0];
    }
    const allProviders = this.getAll();
    return allProviders.length > 0 ? allProviders[0] : null;
  }

  /**
   * Get provider for a specific deployment type.
   *
   * Returns the first provider that supports the deployment type.
   *
   * @param {string} deploymentType Deployment type
   * @return {Function|null} Provider class or null if not found
   */
  getForDeploymentType(deploymentType) {
    const matchingProviders = this.getByDeploymentType(deploymentType);
    return matchingProviders.length > 0 ? matchingProviders[0] : null;
  }

  /**
   * Check if a provider is registered.
   *
   * @param {string} providerId Provider ID
   * @return {boolean} True if registered
   */
  has(providerId) {
    return providers.has(providerId);
  }

  /**
   * Get count of registered providers.
   *
   * @return {number} Number of registered providers
   */
  count() {
    return providers.size;
  }

  /**
   * Parse instance ID into provider type and UUID.
   *
   * Instance IDs have format: {provider_type}:{uuid}
   * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
   *
   * @param {string} instanceId Instance ID to parse
   * @return {{provider_type: string, uuid: string}|null} Parsed components or null if invalid format
   */
  parseInstanceId(instanceId) {
    if (!instanceId || typeof instanceId !== 'string') {
      return null;
    }
    const parts = instanceId.split(':', 2);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }
    return {
      provider_type: parts[0],
      uuid: parts[1]
    };
  }

  /**
   * Get provider class for an instance ID.
   *
   * Extracts the provider type from the instance ID and returns the corresponding provider class.
   *
   * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
   * @return {Function|null} Provider class or null if not found
   */
  getProviderForInstance(instanceId) {
    const parsed = this.parseInstanceId(instanceId);
    if (!parsed) {
      return null;
    }
    return this.get(parsed.provider_type);
  }

  /**
   * Create a new instance ID for a provider type.
   *
   * Generates a UUID v4 and combines it with the provider type.
   *
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @return {string} Instance ID (format: {provider_type}:{uuid})
   */
  createInstanceId(providerType) {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
    return `${providerType}:${uuid}`;
  }

  /**
   * Clear all registered providers.
   *
   * Useful for testing or resetting state.
   *
   * @return {void}
   */
  clear() {
    providers.clear();
  }
}

// Create singleton instance
const registry = new ProviderRegistry();

/**
 * Hook into aether.providers.register to auto-register providers.
 *
 * When providers call doAction('aether.providers.register', ProviderClass),
 * this will automatically register them.
 */
(0,external_wp_hooks_.addAction)('aether.providers.register', 'aether/provider-registry', ProviderClass => {
  if (!ProviderClass || typeof ProviderClass !== 'function') {
    return;
  }

  // Get provider ID from static property
  const providerId = ProviderClass.ID;
  if (!providerId) {
    return; // Invalid provider - must have static ID
  }

  // Register the provider class
  registry.register(providerId, ProviderClass);
});

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;
if (typeof window !== 'undefined') {
  window.aether = window.aether || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.aether.ProviderRegistry) {
    window.aether.ProviderRegistry = registry;
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.aether.ProviderRegistry;
    // Copy any providers from this instance to the global one
    const localProviders = Array.from(providers.values());
    localProviders.forEach(ProviderClass => {
      const providerId = ProviderClass.ID;
      if (!globalRegistry.get(providerId)) {
        globalRegistry.register(providerId, ProviderClass);
      }
    });
    // Use the global registry instead
    exportedRegistry = globalRegistry;
  }
}
/* harmony default export */ const registry_ProviderRegistry = (exportedRegistry);
;// ./assets/src/export/steps/uploadBlueprintBundle/index.js
/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 * Uses the StorageService adapter pattern for provider instance isolation.
 *
 * @since 1.0.0
 */








/**
 * Check if step should be skipped for this provider
 *
 * Uses the StepExecutor's native skip mechanism to avoid running
 * the handler for providers that don't support blueprint bundles.
 *
 * @param {Object} context - Execution context
 * @return {boolean} True if step should be skipped
 */
function shouldSkip(context) {
  const {
    currentProviderInstance
  } = context;
  if (!currentProviderInstance) {
    return false; // Let handler throw the proper error
  }
  const providerType = currentProviderInstance.id?.split(':')[0];
  const ProviderClass = providerType ? registry_ProviderRegistry.get(providerType) : null;
  const providerDeploymentType = currentProviderInstance.deploymentType || ProviderClass?.DEPLOYMENT_TYPE;

  // Skip if provider doesn't handle blueprint bundles
  return providerDeploymentType !== DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE;
}

/**
 * Upload blueprint bundle step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Object}   context.blueprintBundle         - Bundle data from createBlueprintBundle
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.setStatusMessage        - Status message updater
 * @param {Function} context.setStepProgress         - Step progress updater
 * @return {Promise<Object>} Step result
 */
async function uploadBlueprintBundle_handler(context) {
  const {
    currentProviderInstance,
    blueprintBundle,
    siteUrl,
    setStatusMessage
  } = context;
  if (!currentProviderInstance) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Provider instance not found in thread context', 'aether-site-exporter'));
  }
  const providerId = currentProviderInstance.id;
  const providerLabel = currentProviderInstance.label || currentProviderInstance.id;
  const bundleSize = blueprintBundle?.bundleSize || 0;
  const bundleSizeFormatted = formatFileSize(bundleSize);
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Uploading blueprint bundle (%2$s) to %1$s…', 'aether-site-exporter'), providerLabel, bundleSizeFormatted), 'progress', 'uploadBlueprintBundle');

  // Fetch provider config to get export_path
  const providerConfig = await fetchProviderConfig(providerId);
  const exportPath = providerConfig.export_path || 'blueprint-bundle/bundle.zip';

  // Build storage config and create storage service
  const storageConfig = buildStorageConfig(siteUrl, siteUrl, providerId);
  const storageService = await createStorageService(exportPath, storageConfig, providerId, providerConfig);
  if (!storageService) {
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Provider label */
    (0,external_wp_i18n_namespaceObject.__)('Storage service not available for %s', 'aether-site-exporter'), providerLabel));
  }

  // For blueprint bundles, we need to pass the source URL via metadata
  // since the actual file is on the server and needs to be fetched
  const dummyBlob = new Blob([], {
    type: 'application/zip'
  });
  const uploadResult = await storageService.upload(exportPath, dummyBlob, {
    contentType: 'application/zip',
    sourcePath: blueprintBundle.bundlePath,
    sourceUrl: blueprintBundle.bundleUrl,
    // URL for fetching the file
    filePath: blueprintBundle.bundlePath,
    metadata: {
      siteUrl,
      exportPath
    }
  });
  if (!uploadResult.success) {
    throw new Error(uploadResult.error || (0,external_wp_i18n_namespaceObject.__)('Failed to upload blueprint bundle', 'aether-site-exporter'));
  }

  // Report success
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: File size */
  (0,external_wp_i18n_namespaceObject.__)('Uploaded blueprint bundle (%2$s) to %1$s', 'aether-site-exporter'), providerLabel, bundleSizeFormatted), 'success', 'uploadBlueprintBundle');
  return {
    bundleUploadResults: {
      providerId,
      providerLabel,
      success: true,
      exportPath,
      bundleSize
    }
  };
}

/**
 * Step definition
 */
const uploadBlueprintBundle_stepDefinition = {
  id: 'uploadBlueprintBundle',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Blueprint Bundle', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Upload blueprint-bundle.zip to providers', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['createBlueprintBundle'],
  skip: shouldSkip,
  requires: {
    currentProviderInstance: {
      from: 'thread',
      required: true
    },
    blueprintBundle: {
      from: 'createBlueprintBundle',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    setStepProgress: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    bundleUploadResults: {
      type: 'object',
      scope: 'thread'
    }
  },
  handler: uploadBlueprintBundle_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-uploadBlueprintBundle', registry => {
  registry.register(uploadBlueprintBundle_stepDefinition);
}, 10);
;// ./assets/src/export/steps/uploadStaticFiles/index.js
/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses useStaticSiteGenerator to process URLs and upload files via unified action system.
 *
 * @since 1.0.0
 */







/**
 * Check if step should be skipped for this provider
 *
 * Uses the StepExecutor's native skip mechanism to avoid running
 * the handler for providers that don't support static sites.
 *
 * @param {Object} context - Execution context
 * @return {boolean} True if step should be skipped
 */
function uploadStaticFiles_shouldSkip(context) {
  const {
    currentProviderInstance
  } = context;
  if (!currentProviderInstance) {
    return false; // Let handler throw the proper error
  }
  const providerType = currentProviderInstance.id?.split(':')[0];
  const ProviderClass = providerType ? registry_ProviderRegistry.get(providerType) : null;
  const providerDeploymentType = currentProviderInstance.deploymentType || ProviderClass?.DEPLOYMENT_TYPE;

  // Skip if provider doesn't handle static sites
  return providerDeploymentType !== DEPLOYMENT_TYPES.STATIC_SITE;
}

/**
 * Upload static files step handler
 *
 * Processes a single provider instance (thread context).
 * Called once per provider by ThreadOrchestrator.
 *
 * @param {Object}   context                         - Execution context
 * @param {Object}   context.currentProviderInstance - Current provider instance from thread
 * @param {Array}    context.urls                    - URLs from preScanStaticSite (includes assets)
 * @param {string}   context.staticSiteUrl           - Static site URL
 * @param {Map}      context.sharedHtmlData          - Pre-fetched HTML data from preScanStaticSite
 * @param {Object}   context.blueprintData           - Blueprint data
 * @param {string}   context.siteUrl                 - WordPress site URL
 * @param {Function} context.processStaticSiteUrls   - Static site generator function
 * @param {Function} context.setStatusMessage        - Status message updater
 * @return {Promise<Object>} Step result with uploaded files
 */
async function uploadStaticFiles_handler(context) {
  const {
    currentProviderInstance,
    urls,
    staticSiteUrl,
    sharedHtmlData,
    siteUrl,
    processStaticSiteUrls,
    setStatusMessage,
    updateStaticSiteProgressContext
  } = context;

  // blueprintData is optional and may be passed via context if available
  const blueprintData = context.blueprintData || null;
  if (!currentProviderInstance) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Provider instance not found in thread context', 'aether-site-exporter'));
  }
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  if (!processStaticSiteUrls) {
    throw new Error((0,external_wp_i18n_namespaceObject.__)('Static site generator not available', 'aether-site-exporter'));
  }
  const providerId = currentProviderInstance.id;
  const providerLabel = currentProviderInstance.label || currentProviderInstance.id;
  setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Provider label */
  (0,external_wp_i18n_namespaceObject.__)('Processing static site for %s…', 'aether-site-exporter'), providerLabel), 'progress', 'uploadStaticFiles');

  // Fetch provider config to get provider-specific public_url
  // This ensures each provider uses its own staticSiteUrl (e.g., http://localhost:10003/static3)
  // instead of the global one from getStaticSiteUrls
  let providerSpecificStaticSiteUrl = staticSiteUrl;
  try {
    const providerConfig = await fetchProviderConfig(providerId);
    if (providerConfig.public_url) {
      providerSpecificStaticSiteUrl = providerConfig.public_url;
    }
  } catch (error) {
    // If fetching provider config fails, fall back to global staticSiteUrl
    // This should not happen in normal operation, but provides a safety net
  }

  // Filter URLs before processing
  const filteredUrls = (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.urls', urls, [providerId], {
    siteUrl,
    blueprintData,
    staticSiteUrl: providerSpecificStaticSiteUrl,
    providerId
  });

  // Update progress context with current provider ID
  // This enables the progress callback to update provider-specific progress bars
  if (updateStaticSiteProgressContext) {
    updateStaticSiteProgressContext(0, 1, providerId);
  }

  // Process URLs for this provider instance
  // Pass shared HTML data so it uses stored HTML instead of fetching again
  // Use provider-specific staticSiteUrl for correct URL rewriting
  const result = await processStaticSiteUrls(filteredUrls, providerSpecificStaticSiteUrl, providerId, siteUrl, setStatusMessage, blueprintData, null,
  // removeMessage
  sharedHtmlData // Pass shared HTML data from preScanStaticSite
  );

  // Check if upload succeeded
  const filesUploaded = result.filesUploaded || 0;
  const success = result.success && filesUploaded > 0;
  if (success) {
    setStatusMessage((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$d: Files uploaded */
    (0,external_wp_i18n_namespaceObject.__)('Uploaded %2$d files to %1$s', 'aether-site-exporter'), providerLabel, filesUploaded), 'success', 'uploadStaticFiles');
  } else {
    const errorMessage = result.error || (0,external_wp_i18n_namespaceObject.__)('No files uploaded', 'aether-site-exporter');
    throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$s: Provider label, %2$s: Error message */
    (0,external_wp_i18n_namespaceObject.__)('Failed to upload to %1$s: %2$s', 'aether-site-exporter'), providerLabel, errorMessage));
  }
  return (0,external_wp_hooks_.applyFilters)('aether.export.step.uploadStaticSiteFiles.result', {
    staticUploadResults: {
      providerId,
      providerLabel,
      success,
      filesUploaded: result.filesUploaded || 0,
      filesSkipped: result.filesSkipped || 0,
      urlsProcessed: result.urlsProcessed || 0,
      urlsSucceeded: result.urlsSucceeded || 0,
      urlsFailed: result.urlsFailed || 0,
      assetsUploaded: result.assetsUploaded || 0,
      assetsFailed: result.assetsFailed || 0,
      failedUrls: result.failedUrls || [],
      uploadedFiles: result.uploadedFiles || []
    }
  }, providerId, {
    siteUrl,
    blueprintData,
    staticSiteUrl
  });
}

/**
 * Step definition
 */
const uploadStaticFiles_stepDefinition = {
  id: 'uploadStaticFiles',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Static Files', 'aether-site-exporter'),
  description: (0,external_wp_i18n_namespaceObject.__)('Generate and upload static HTML files', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['preScanStaticSite'],
  skip: uploadStaticFiles_shouldSkip,
  requires: {
    currentProviderInstance: {
      from: 'thread',
      required: true
    },
    urls: {
      from: 'preScanStaticSite',
      required: true
    },
    staticSiteUrl: {
      from: 'getStaticSiteUrls',
      required: true
    },
    sharedHtmlData: {
      from: 'preScanStaticSite',
      required: true
    },
    siteUrl: {
      from: 'initial',
      required: true
    },
    processStaticSiteUrls: {
      from: 'initial',
      required: true
    },
    setStatusMessage: {
      from: 'initial',
      required: true
    },
    updateStaticSiteProgressContext: {
      from: 'initial',
      required: false
    }
  },
  provides: {
    staticUploadResults: {
      type: 'object',
      scope: 'thread'
    }
  },
  handler: uploadStaticFiles_handler
};

/**
 * Register step via WordPress hooks
 */
(0,external_wp_hooks_.addAction)('aether.export.register_steps', 'aether/step-uploadStaticFiles', registry => {
  registry.register(uploadStaticFiles_stepDefinition);
}, 10);
;// ./assets/src/export/steps/index.js
/**
 * Step Registry
 *
 * Steps register themselves dynamically via WordPress hooks.
 * This file triggers step registration and provides helper functions.
 *
 * @since 1.0.0
 */




// Import step files to ensure they register themselves








/**
 * Get all registered steps
 *
 * Triggers step registration via hooks and returns collected steps.
 *
 * @return {Array<Object>} Array of step definitions
 */
function getRegisteredSteps() {
  const registry = registry_StepRegistry.getInstance();

  // Clear previous registrations (for re-initialization)
  registry.clear();

  // Trigger registration hook - steps self-register
  (0,external_wp_hooks_.doAction)('aether.export.register_steps', registry);
  return registry.getSteps();
}

/**
 * Get steps filtered by which providers are enabled
 *
 * Uses provider INSTANCE arrays (not ID arrays) to ensure validation.
 * This prevents steps from executing when all provider instances are disabled/invalid.
 *
 * @param {Object} context - Execution context with provider instance arrays
 * @return {Array<Object>} Filtered steps based on enabled provider instances
 */
function getActiveSteps(context) {
  const {
    staticSiteProviderInstances = [],
    blueprintBundleProviderInstances = []
  } = context;
  const steps = getRegisteredSteps();

  // Filter out steps that should be skipped based on provider configuration
  const filteredSteps = steps.filter(step => {
    // If step has a static skip function, check it
    if (typeof step.shouldSkip === 'function') {
      return !step.shouldSkip(context);
    }

    // Skip blueprint-related steps if no blueprint bundle provider INSTANCES
    if (step.id === 'discoverBlueprintBundleAssets' || step.id === 'createWpContentArchive' || step.id === 'createBlueprintBundle' || step.id === 'uploadBlueprintBundle') {
      return blueprintBundleProviderInstances.length > 0;
    }

    // Skip static site steps if no static site provider INSTANCES
    if (step.id === 'preScanStaticSite' || step.id === 'uploadStaticFiles') {
      return staticSiteProviderInstances.length > 0;
    }
    return true;
  });
  return filteredSteps;
}
;// ./assets/src/export/utils/exportConfiguration.js
/**
 * Export Configuration Utilities
 *
 * Pure functions for preparing export workflow configuration.
 * These functions are extracted from useExportController for testability.
 *
 */



/**
 * Prepare export configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse - Response from settings API
 * @return {Object} Configuration object with provider IDs
 */
function prepareExportConfiguration(settingsResponse) {
  const settings = settingsResponse?.settings || {};
  const providerTypes = settings.provider_types || {};
  return {
    storageProviderId: providerTypes.storage || '',
    staticSiteProviderId: providerTypes.static_site || '',
    providerConfigs: settings.providers || {}
  };
}

/**
 * Get provider instances for a specific deployment type
 *
 * Filters provider configurations to find instances
 * that support the specified deployment type based on their provider type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<string>} Array of instance IDs
 */
function getEnabledInstancesForDeploymentType(providerConfigs, deploymentType) {
  try {
    if (!providerConfigs || typeof providerConfigs !== 'object') {
      return [];
    }
    return Object.entries(providerConfigs).filter(([, instanceConfig]) => {
      if (!instanceConfig || typeof instanceConfig !== 'object') {
        return false;
      }

      // Check if provider type supports this deployment type
      const providerType = instanceConfig.provider_type;
      if (!providerType) {
        return false;
      }

      // Get provider class from registry and check if it supports the deployment type
      const ProviderClass = registry_ProviderRegistry.get(providerType);
      if (!ProviderClass) {
        return false;
      }
      const supportsType = ProviderClass.DEPLOYMENT_TYPE === deploymentType;
      return supportsType;
    }).map(([id]) => id);
  } catch (error) {
    return [];
  }
}

/**
 * Validate a provider instance configuration
 *
 * Checks that the instance has required properties and valid configuration.
 *
 * @param {string} instanceId - Instance ID
 * @param {Object} config     - Instance configuration
 * @return {boolean} True if instance is valid
 */
function isValidProviderInstance(instanceId, config) {
  // Must have non-empty ID
  if (!instanceId || typeof instanceId !== 'string') {
    return false;
  }

  // Must have config object
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Must have provider_type
  if (!config.provider_type) {
    return false;
  }
  return true;
}

/**
 * Build provider instance objects from configurations
 *
 * Creates array of provider instances with full config for threading.
 * Each instance has id, label, and complete configuration.
 * Validates each instance to ensure it's properly configured.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType  - Deployment type to filter by
 * @return {Array<Object>} Valid provider instance objects with { id, label, config }
 */
function buildProviderInstances(providerConfigs, deploymentType) {
  const instanceIds = getEnabledInstancesForDeploymentType(providerConfigs, deploymentType);
  return instanceIds
  // Map to instance objects
  .map(instanceId => {
    const config = providerConfigs[instanceId] || {};
    return {
      id: instanceId,
      label: config.instance_name || config.label || instanceId,
      config
    };
  })
  // Validate and filter out invalid instances
  .filter(instance => isValidProviderInstance(instance.id, instance.config));
}

/**
 * Determine providers for all deployment types
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each deployment type.
 *
 * @param {Object}        providerConfigs - All provider configurations
 * @param {Array<string>} deploymentTypes - Array of deployment type constants
 * @return {Object} Object with arrays of instance IDs keyed by deployment type
 */
function determineProvidersByDeploymentType(providerConfigs, deploymentTypes) {
  const result = {};
  deploymentTypes.forEach(deploymentType => {
    const instances = getEnabledInstancesForDeploymentType(providerConfigs, deploymentType);
    result[deploymentType] = instances;
  });
  return result;
}

/**
 * Build workflow context from configuration
 *
 * Pure function that assembles the context object
 * needed for workflow execution.
 *
 * @param {Object} config       - Configuration object
 * @param {Object} dependencies - External dependencies
 * @return {Object} Workflow context
 */
function buildWorkflowContext(config, dependencies) {
  const {
    siteUrl,
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders,
    staticSiteProviderInstances,
    blueprintBundleProviderInstances,
    edgeFunctionProviderInstances
  } = config;
  const {
    api,
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    setStatusMessage,
    setStepProgress,
    setProviderProgress
  } = dependencies;
  return {
    // API and state
    api,
    siteUrl,
    // Provider arrays by deployment type (from PHP registry via REST API)
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders,
    // Provider instance arrays for threading (with full config objects)
    staticSiteProviderInstances,
    blueprintBundleProviderInstances,
    edgeFunctionProviderInstances,
    // Provider instance references (for thread context)
    providerInstances: config.providerInstances || [],
    currentProviderInstance: config.currentProviderInstance || null,
    // Hooks and utilities
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    // State setters
    setStatusMessage,
    setStepProgress,
    setProviderProgress,
    // Discovered assets (populated during workflow)
    discoveredAssets: null
  };
}
;// ./assets/src/export/hooks/useExportController.js
/**
 * Publish Controller Hook
 *
 * Orchestrates the export workflow using phase-based execution
 *
 */











function useExportController(exportState) {
  const {
    setIsExporting,
    updateFromStep,
    markAllComplete,
    showError,
    initializeSteps,
    setStatusMessage,
    setOverallProgressValue,
    setStepProgress,
    setProviderProgress,
    setProviderInstances,
    removeMessage,
    setProviders
  } = exportState;

  // State for storage provider ID (set before starting export)
  // Must be declared before hooks that use it
  const [setStorageProviderId] = (0,external_wp_element_namespaceObject.useState)('');
  const api = useExportAPI();
  const assetManager = useAssetManager();

  // Create blueprint generator hook.
  const {
    generateBlueprint: generateBlueprintJson
  } = useBlueprintGenerator();

  // Provider context for progress tracking across multiple providers
  // This allows the progress callback to adjust progress based on the current provider index
  const staticSiteProgressContext = (0,external_wp_element_namespaceObject.useRef)({
    providerIndex: 0,
    totalProviders: 1,
    currentProviderId: null
  });

  // Function to update static site progress context
  // This allows the step handler to set the current provider index before processing
  const updateStaticSiteProgressContext = (0,external_wp_element_namespaceObject.useCallback)((providerIndex, totalProviders, currentProviderId = null) => {
    staticSiteProgressContext.current = {
      providerIndex,
      totalProviders,
      currentProviderId
    };
  }, []);

  // Create static site generator with progress callback
  const processStaticSiteUrls = useStaticSiteGenerator((uploadedFiles, totalFiles) => {
    if (totalFiles > 0 && uploadedFiles >= 0) {
      // Get current provider context
      const {
        providerIndex,
        totalProviders,
        currentProviderId
      } = staticSiteProgressContext.current;

      // Calculate raw numbers accounting for multiple providers
      // For multiple providers, we need to calculate the total across all providers
      // and the current position across all providers
      const progress = totalProviders > 1 ? {
        // For multiple providers, each provider processes totalFiles
        // Current position: providerIndex * totalFiles + uploadedFiles
        // Total: totalProviders * totalFiles
        current: providerIndex * totalFiles + uploadedFiles,
        total: totalProviders * totalFiles
      } : {
        // Single provider - use raw numbers directly
        current: uploadedFiles,
        total: totalFiles
      };

      // Update step progress (overall progress bar)
      setStepProgress('uploadStaticFiles', progress);

      // Update provider-specific progress for the progress bars
      // This is critical because processStaticSiteUrls bypasses ThreadOrchestrator's
      // wrapped setStepProgress that normally calls setProviderProgress
      if (currentProviderId) {
        setProviderProgress(currentProviderId, {
          stepId: 'uploadStaticFiles',
          stepLabel: 'Upload Static Files',
          progress: {
            current: uploadedFiles,
            total: totalFiles
          },
          status: 'active'
        });
      }
    }
  });
  const startExport = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    try {
      // Initialize steps with 'discoverBlueprintBundleAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps(getRegisteredSteps(), 'discoverBlueprintBundleAssets');
      // Set isExporting to true to start the workflow
      setIsExporting(true);

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await (0,utils_api/* default */.Ay)({
        path: '/aether/site-exporter/settings'
      });

      // Use pure function to extract configuration
      const exportConfig = prepareExportConfiguration(settingsResponse);

      // Update storage provider ID state
      if (settingsResponse.success && exportConfig.storageProviderId) {
        setStorageProviderId(exportConfig.storageProviderId);
      }

      // Fetch asset status
      try {
        const assetStatusResponse = await api.getAssetStatus();
        if (assetStatusResponse.success && assetStatusResponse.assets) {
          assetManager.syncWithServer(assetStatusResponse.assets);
        }
      } catch (assetError) {
        // Asset status fetch is not critical - log and continue
      }

      // Activate the first step immediately to update UI
      updateFromStep('discoverBlueprintBundleAssets');

      // Get current site URL for static site generation (use pure function)
      const siteUrl = window.location.origin;

      // Get arrays of instance IDs for each deployment type (use pure function)
      const providersByType = determineProvidersByDeploymentType(exportConfig.providerConfigs, [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, DEPLOYMENT_TYPES.EDGE_FUNCTIONS]);
      const staticSiteProviders = providersByType[DEPLOYMENT_TYPES.STATIC_SITE];
      const blueprintBundleProviders = providersByType[DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
      const edgeFunctionProviders = providersByType[DEPLOYMENT_TYPES.EDGE_FUNCTIONS];

      // Build provider instance objects for threading
      const staticSiteProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.STATIC_SITE);
      const blueprintBundleProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE);
      const edgeFunctionProviderInstances = buildProviderInstances(exportConfig.providerConfigs, DEPLOYMENT_TYPES.EDGE_FUNCTIONS);

      // Store provider arrays in global state for UI access
      setProviders(staticSiteProviders, blueprintBundleProviders);

      // Determine provider instances for threading
      // Use all provider instances across all deployment types
      const allProviderInstances = [...staticSiteProviderInstances, ...blueprintBundleProviderInstances, ...edgeFunctionProviderInstances];

      // Store provider instances in context for UI access (includes labels)
      setProviderInstances(allProviderInstances);

      // Build context object with all dependencies for step handlers (use pure function)
      const workflowContext = buildWorkflowContext({
        siteUrl,
        staticSiteProviders,
        blueprintBundleProviders,
        edgeFunctionProviders,
        staticSiteProviderInstances,
        blueprintBundleProviderInstances,
        edgeFunctionProviderInstances
      }, {
        api,
        processStaticSiteUrls,
        generateBlueprintJson,
        updateStaticSiteProgressContext,
        assetManager,
        setStatusMessage,
        setStepProgress,
        setProviderProgress
      });

      // Add additional UI callbacks not in pure function (to avoid coupling)
      workflowContext.setOverallProgressValue = setOverallProgressValue;
      workflowContext.removeMessage = removeMessage;

      // Execute full workflow - individual steps check provider type

      // Set up workflow lifecycle callbacks for UI updates
      const workflowOptions = {
        onStepStart: stepId => {
          // Update UI with step ID
          updateFromStep(stepId);
        },
        onStepComplete: () => {},
        onStepSkipped: () => {},
        onError: () => {}
      };

      // Get steps filtered by enabled providers
      const activeSteps = getActiveSteps(workflowContext);

      // Execute workflow with ThreadOrchestrator (handles 0, 1, or N providers)
      await executeThreadedWorkflow(activeSteps, workflowContext, allProviderInstances, workflowOptions);

      // Clear asset upload tracking flags (reset state for next export)
      assetManager.clearUploadFlags();

      // Update UI to show all steps as complete with success message
      markAllComplete({
        status: 'complete'
      });

      // Release exporting lock (allows user to start new export)
      setIsExporting(false);
    } catch (error) {
      showError(`Failed to start: ${error.message}`);
      setIsExporting(false);
    }
  }, [setIsExporting, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, updateStaticSiteProgressContext, processStaticSiteUrls, generateBlueprintJson, setStatusMessage, setStepProgress, setProviderProgress, setProviderInstances, removeMessage, setOverallProgressValue, setProviders, markAllComplete]);
  return {
    startExport
  };
}
;// ./assets/src/utils/styles.js
/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 */

const colors = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  primaryDark: '#0a4168',
  text: '#1d2327',
  textMuted: '#646970',
  textSecondary: '#50575e',
  white: '#fff',
  black: '#000',
  background: '#f6f7f7',
  backgroundLighter: '#f0f0f1',
  backgroundError: '#fcf0f1',
  backgroundSuccess: '#d5f0dd',
  backgroundWarning: '#fcf0c7',
  backgroundInfo: '#d7edff',
  borderLight: '#c3c4c7',
  borderLighter: '#e0e0e0',
  borderActive: '#007cba',
  error: '#d63638',
  errorDark: '#c22c2e',
  success: '#00a32a',
  successDark: '#00833e',
  warning: '#dba617',
  warningDark: '#826200',
  info: '#2271b1',
  // Deployment type colors
  deploymentStaticSite: '#2271b1',
  deploymentBlueprintBundle: '#00a32a',
  deploymentEdgeFunctions: '#986800',
  // Overlay/shadow colors
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowLighter: 'rgba(0, 0, 0, 0.05)',
  shadowActive: 'rgba(0, 124, 186, 0.1)'
};
const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem'
};
const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px'
};
const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem'
};
const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
const commonStyles = {
  section: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: `0 1px 1px ${colors.shadowLight}`,
    marginBottom: spacing.lg,
    padding: 0
  },
  sectionHeader: {
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    background: colors.background
  },
  card: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.sm,
    padding: spacing.lg
  }
};
const statusBadgeStyles = {
  base: {
    display: 'inline-block',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: '0.5px'
  },
  success: {
    background: colors.backgroundSuccess,
    color: colors.successDark
  },
  error: {
    background: colors.backgroundError,
    color: colors.errorDark
  },
  warning: {
    background: colors.backgroundWarning,
    color: colors.warningDark
  },
  info: {
    background: colors.backgroundInfo,
    color: colors.primaryHover
  }
};
const noticeStyles = {
  base: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
    borderLeft: '4px solid',
    background: colors.white
  },
  success: {
    borderLeftColor: colors.success,
    background: colors.backgroundSuccess
  },
  error: {
    borderLeftColor: colors.error,
    background: colors.backgroundError
  },
  warning: {
    borderLeftColor: colors.warning,
    background: colors.backgroundWarning
  },
  info: {
    borderLeftColor: colors.info,
    background: colors.backgroundInfo
  }
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
const createFlexStyle = (direction = 'row', gap = spacing.md) => ({
  display: 'flex',
  flexDirection: direction,
  gap
});
;// ./assets/src/components/GlobalStepsProgress/StepNode.js
/**
 * StepNode Component
 *
 * Renders an individual step circle in the horizontal stepper.
 * Shows status via icon/number and color.
 *
 * @since 1.0.0
 */




const NODE_SIZE = 28;
const nodeBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: `${NODE_SIZE}px`,
  height: `${NODE_SIZE}px`,
  borderRadius: '50%',
  fontSize: fontSize.xs,
  fontWeight: fontWeight.bold,
  flexShrink: 0,
  transition: 'all 0.2s ease',
  border: '2px solid transparent'
};
const spinnerStyle = {
  width: '16px',
  height: '16px',
  margin: 0
};

/**
 * Get status-specific styles for the node
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getNodeStatusStyle(status) {
  switch (status) {
    case 'active':
      return {
        background: colors.backgroundInfo,
        borderColor: colors.primary,
        color: colors.primary,
        boxShadow: `0 0 0 4px ${colors.backgroundInfo}`
      };
    case 'complete':
      return {
        background: colors.success,
        borderColor: colors.success,
        color: colors.white
      };
    case 'error':
      return {
        background: colors.error,
        borderColor: colors.error,
        color: colors.white
      };
    default:
      // pending
      return {
        background: colors.white,
        borderColor: colors.borderLighter,
        color: colors.textMuted
      };
  }
}

/**
 * Get the content to display inside the node
 *
 * @param {string} status     Step status
 * @param {number} stepNumber Step number (1-indexed)
 * @return {JSX.Element|string} Node content
 */
function getNodeContent(status, stepNumber) {
  switch (status) {
    case 'active':
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
        style: spinnerStyle
      });
    case 'complete':
      return '✓';
    case 'error':
      return '✗';
    default:
      return stepNumber;
  }
}

/**
 * StepNode Component
 *
 * @param {Object} props            Component props
 * @param {number} props.stepNumber Step number (1-indexed)
 * @param {string} props.label      Step label for tooltip
 * @param {string} props.status     Step status ('pending', 'active', 'complete', 'error')
 * @return {JSX.Element} StepNode component
 */
function StepNode({
  stepNumber,
  label,
  status
}) {
  const statusStyle = getNodeStatusStyle(status);
  const content = getNodeContent(status, stepNumber);
  const node = /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
    className: `aether-step-node aether-step-node--${status}`,
    style: {
      ...nodeBaseStyle,
      ...statusStyle
    },
    role: "listitem",
    "aria-label": `Step ${stepNumber}: ${label} - ${status}`,
    children: content
  });
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Tooltip, {
    text: label,
    position: "bottom center",
    children: node
  });
}
/* harmony default export */ const GlobalStepsProgress_StepNode = ((/* unused pure expression or super */ null && (StepNode)));
;// ./assets/src/components/GlobalStepsProgress/StepConnector.js
/**
 * StepConnector Component
 *
 * Renders a connecting line between step nodes.
 * Changes color based on completion status.
 *
 * @since 1.0.0
 */



const connectorStyle = {
  flex: 1,
  height: '2px',
  minWidth: '20px',
  maxWidth: '60px',
  transition: 'background-color 0.3s ease'
};

/**
 * StepConnector Component
 *
 * @param {Object}  props            Component props
 * @param {boolean} props.isComplete Whether the preceding step is complete
 * @return {JSX.Element} StepConnector component
 */
function StepConnector({
  isComplete
}) {
  const backgroundColor = isComplete ? colors.success : colors.borderLighter;
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
    className: "aether-step-connector",
    style: {
      ...connectorStyle,
      backgroundColor
    },
    "aria-hidden": "true"
  });
}
/* harmony default export */ const GlobalStepsProgress_StepConnector = ((/* unused pure expression or super */ null && (StepConnector)));
;// ./assets/src/components/GlobalStepsProgress/HorizontalStepper.js
/**
 * HorizontalStepper Component
 *
 * Displays steps in a compact horizontal layout with connected nodes.
 * Shows current step label and progress count.
 *
 * @since 1.0.0
 */






const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  padding: spacing.md,
  background: colors.backgroundInfo,
  borderRadius: borderRadius.md,
  marginBottom: spacing.lg
};
const stepsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs
};
const infoRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: fontSize.sm
};
const currentStepStyle = {
  color: colors.primary,
  fontWeight: fontWeight.medium
};
const countStyle = {
  color: colors.textMuted,
  fontSize: fontSize.xs
};

/**
 * HorizontalStepper Component
 *
 * @param {Object} props            Component props
 * @param {Array}  props.steps      Array of step objects with id, label, status
 * @param {Object} props.stepLabels Map of step ID to human-readable label
 * @return {JSX.Element} HorizontalStepper component
 */
function HorizontalStepper({
  steps,
  stepLabels
}) {
  const completedCount = steps.filter(step => step.status === 'complete').length;
  const activeStep = steps.find(step => step.status === 'active');
  const activeStepLabel = activeStep ? stepLabels[activeStep.id] || activeStep.label : (0,external_wp_i18n_namespaceObject.__)('Preparing…', 'aether-site-exporter');
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-horizontal-stepper",
    style: containerStyle,
    role: "list",
    "aria-label": (0,external_wp_i18n_namespaceObject.__)('Export progress', 'aether-site-exporter'),
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-horizontal-stepper__steps",
      style: stepsRowStyle,
      children: steps.map((step, index) => {
        const stepLabel = stepLabels[step.id] || step.label;
        const isLastStep = index === steps.length - 1;
        const isStepComplete = step.status === 'complete';
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StepNode, {
            stepNumber: index + 1,
            label: stepLabel,
            status: step.status
          }, step.id), !isLastStep && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(StepConnector, {
            isComplete: isStepComplete
          }, `connector-${index}`)]
        });
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-horizontal-stepper__info",
      style: infoRowStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: currentStepStyle,
        children: activeStepLabel
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        style: countStyle,
        children: ["(", completedCount, "/", steps.length, ")"]
      })]
    })]
  });
}
/* harmony default export */ const GlobalStepsProgress_HorizontalStepper = ((/* unused pure expression or super */ null && (HorizontalStepper)));
;// ./assets/src/components/GlobalStepsProgress/index.js
/**
 * Global Steps Progress Component
 *
 * Displays progress for global export steps (those that run once before
 * per-provider thread steps). Uses a compact horizontal stepper layout.
 *
 * @since 1.0.0
 */




/**
 * IDs of global steps (steps that run once, not per-provider)
 * These are the steps that need visual feedback at the start of export.
 */

const GLOBAL_STEP_IDS = ['discoverBlueprintBundleAssets', 'getStaticSiteUrls', 'preScanStaticSite', 'createWpContentArchive', 'createBlueprintBundle'];

/**
 * Check if all global steps are complete
 *
 * @param {Array} steps - Array of step objects with id and status
 * @return {boolean} True if all global steps are complete
 */
function areGlobalStepsComplete(steps) {
  if (!steps || steps.length === 0) {
    return false;
  }
  const globalSteps = steps.filter(step => GLOBAL_STEP_IDS.includes(step.id));
  if (globalSteps.length === 0) {
    return false;
  }
  return globalSteps.every(step => step.status === 'complete');
}

/**
 * Human-readable labels for global steps
 */
const STEP_LABELS = {
  discoverBlueprintBundleAssets: (0,external_wp_i18n_namespaceObject.__)('Discovering assets', 'aether-site-exporter'),
  getStaticSiteUrls: (0,external_wp_i18n_namespaceObject.__)('Discovering URLs', 'aether-site-exporter'),
  preScanStaticSite: (0,external_wp_i18n_namespaceObject.__)('Scanning pages', 'aether-site-exporter'),
  createWpContentArchive: (0,external_wp_i18n_namespaceObject.__)('Creating archive', 'aether-site-exporter'),
  createBlueprintBundle: (0,external_wp_i18n_namespaceObject.__)('Building blueprint', 'aether-site-exporter')
};

/**
 * Global Steps Progress Component
 *
 * @param {Object} props       - Component props
 * @param {Array}  props.steps - Array of step objects with id, label, status
 * @return {JSX.Element|null} Global steps progress component or null if no global steps
 */
function GlobalStepsProgress({
  steps
}) {
  // Filter to only show global steps that exist in the steps array
  const globalSteps = steps.filter(step => GLOBAL_STEP_IDS.includes(step.id));

  // Don't render if no global steps or all are complete
  if (globalSteps.length === 0) {
    return null;
  }

  // Check if all global steps are complete
  const allComplete = globalSteps.every(step => step.status === 'complete');

  // Don't show if all global steps are done (thread steps are running)
  if (allComplete) {
    return null;
  }
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(HorizontalStepper, {
    steps: globalSteps,
    stepLabels: STEP_LABELS
  });
}
/* harmony default export */ const components_GlobalStepsProgress = (GlobalStepsProgress);
;// ./assets/src/components/ProgressBar/index.js
/**
 * Progress Bar Component
 *
 * Displays progress using a native HTML progress element with optional description text.
 *
 * @package
 */




/**
 * Progress Bar Component
 *
 * Displays a progress bar with current/total values and optional description.
 *
 * @param {Object} props               - Component props
 * @param {Object} props.progress      - Progress object with `current` (number) and `total` (number) properties
 * @param {string} [props.description] - Optional description text displayed below progress bar
 * @param {number} props.height        - Height of the progress element in pixels
 * @return {JSX.Element} Progress bar component
 */

function ProgressBar({
  progress,
  description,
  height
}) {
  // Calculate percentage for display
  const percentage = progress.total > 0 ? Math.round(progress.current / progress.total * 100) : 0;

  // Container style
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs
  };

  // Progress element style
  const progressStyle = {
    width: '100%',
    height: `${height}px`
  };

  // Description style
  const descriptionStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    margin: 0
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    style: containerStyle,
    className: "aether-progress-bar",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("progress", {
      style: progressStyle,
      max: progress.total,
      value: progress.current,
      "aria-valuenow": progress.current,
      "aria-valuemin": 0,
      "aria-valuemax": progress.total,
      "aria-label": description || (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %1$d: Progress percentage */
      (0,external_wp_i18n_namespaceObject.__)('Progress: %1$d%%', 'aether-site-exporter'), percentage)
    }), description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      style: descriptionStyle,
      className: "aether-progress-bar__description",
      children: description
    })]
  });
}
/* harmony default export */ const components_ProgressBar = (ProgressBar);
;// ./assets/src/components/ProviderProgressBar/index.js
/**
 * Provider Progress Bar Component
 *
 * Displays progress for a single provider instance.
 * Shows provider label, current step, and progress using raw numbers.
 *
 * @since 1.0.0
 */





/**
 * Provider Progress Bar Component
 *
 * @param {Object} props               - Component props
 * @param {string} props.providerId    - Provider instance ID
 * @param {string} props.providerLabel - Provider display label
 * @param {string} props.stepLabel     - Current step label
 * @param {Object} props.progress      - Progress object with `current` and `total` properties
 * @param {string} props.status        - Status: 'active', 'complete', 'error'
 * @param {string} props.error         - Error message (if status is 'error')
 * @return {JSX.Element} Provider progress bar component
 */

function ProviderProgressBar({
  providerId,
  providerLabel,
  stepLabel,
  progress,
  status,
  error
}) {
  // Calculate percentage for display
  const percentage = progress.total > 0 ? Math.round(progress.current / progress.total * 100) : 0;
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      default:
        return null;
    }
  };
  const statusIcon = getStatusIcon();

  // Base container style
  const containerStyle = {
    marginBottom: spacing.lg,
    padding: spacing.md,
    border: `1px solid ${colors.borderLighter}`,
    borderRadius: borderRadius.sm,
    background: colors.white,
    transition: 'all 0.3s ease'
  };

  // Status-specific styles
  if (status === 'active') {
    containerStyle.borderColor = colors.borderActive;
    containerStyle.boxShadow = `0 0 0 1px ${colors.shadowActive}`;
  } else if (status === 'complete') {
    containerStyle.borderColor = colors.success;
    containerStyle.background = colors.background;
  } else if (status === 'error') {
    containerStyle.borderColor = colors.error;
    containerStyle.background = colors.backgroundError;
  }

  // Header style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  };

  // Label style
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: fontSize.sm
  };

  // Status icon style
  const statusIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold
  };
  if (status === 'active') {
    statusIconStyle.animation = 'pulse 1.5s ease-in-out infinite';
  } else if (status === 'complete') {
    statusIconStyle.background = colors.success;
    statusIconStyle.color = colors.white;
  } else if (status === 'error') {
    statusIconStyle.background = colors.error;
    statusIconStyle.color = colors.white;
  }

  // Percentage style
  const percentageStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold
  };

  // Step label style
  const stepStyle = {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontStyle: 'italic'
  };

  // Error message style
  const errorStyle = {
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    background: colors.backgroundError,
    borderRadius: '2px'
  };

  // Complete message style
  const completeMessageStyle = {
    fontSize: fontSize.xs,
    color: colors.success,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium
  };

  // Progress bar wrapper style
  const progressBarWrapperStyle = {
    position: 'relative'
  };

  // Build modifier classes based on status
  const statusModifier = status ? `aether-provider-progress-bar--${status}` : '';
  const containerClasses = ['aether-provider-progress-bar', statusModifier].filter(Boolean).join(' ');
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("style", {
      children: `
					@keyframes pulse {
						0%, 100% {
							opacity: 1;
						}
						50% {
							opacity: 0.5;
						}
					}
				`
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: containerClasses,
      style: containerStyle,
      "data-provider-id": providerId,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-progress-bar__header",
        style: headerStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-provider-progress-bar__label",
          style: labelStyle,
          children: [statusIcon && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
            className: "aether-provider-progress-bar__status-icon",
            style: statusIconStyle,
            children: statusIcon
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-provider-progress-bar__provider-name",
            children: providerLabel
          })]
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-provider-progress-bar__percentage",
          style: percentageStyle,
          children: [percentage, "%"]
        })]
      }), stepLabel && status === 'active' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__step",
        style: stepStyle,
        children: stepLabel
      }), error && status === 'error' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__error",
        style: errorStyle,
        children: error
      }), status === 'complete' && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__complete",
        style: completeMessageStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Complete', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-progress-bar__progress",
        style: progressBarWrapperStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProgressBar, {
          progress: progress,
          height: 8
        })
      })]
    })]
  });
}
/* harmony default export */ const components_ProviderProgressBar = (ProviderProgressBar);
;// ./assets/src/components/ProviderProgressList/index.js
/**
 * Provider Progress List Component
 *
 * Displays a list of provider progress bars.
 * Shows progress for each provider instance running in parallel.
 *
 * @since 1.0.0
 */





/**
 * Provider Progress List Component
 *
 * @param {Object} props                   - Component props
 * @param {Object} props.providerProgress  - Provider progress object { [providerId]: { stepId, stepLabel, progress: { current, total }, status, error } }
 * @param {Array}  props.providerInstances - Array of provider instances { id, label, config }
 * @return {JSX.Element|null} Provider progress list component
 */

function ProviderProgressList({
  providerProgress = {},
  providerInstances = []
}) {
  // If no provider instances, don't render anything
  if (providerInstances.length === 0) {
    return null;
  }

  // Container style
  const containerStyle = {
    margin: '20px 0'
  };

  // Header style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `2px solid ${colors.borderLighter}`
  };

  // Header h4 style
  const headerTitleStyle = {
    margin: 0,
    fontSize: '15px',
    fontWeight: fontWeight.semibold,
    color: colors.text
  };

  // Count badge style
  const countStyle = {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    padding: '4px 8px',
    background: colors.background,
    borderRadius: '12px'
  };

  // Items container style
  const itemsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-progress-list",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-progress-list__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h4", {
        className: "aether-provider-progress-list__title",
        style: headerTitleStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Provider Progress', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-provider-progress-list__count",
        style: countStyle,
        children: [providerInstances.length, ' ', (0,external_wp_i18n_namespaceObject.__)('providers', 'aether-site-exporter')]
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-progress-list__items",
      style: itemsStyle,
      children: providerInstances.map(instance => {
        const progress = providerProgress[instance.id] || {
          stepId: null,
          stepLabel: (0,external_wp_i18n_namespaceObject.__)('Pending', 'aether-site-exporter'),
          progress: {
            current: 0,
            total: 0
          },
          status: 'pending'
        };
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderProgressBar, {
          providerId: instance.id,
          providerLabel: instance.label || instance.id,
          stepLabel: progress.stepLabel,
          progress: progress.progress,
          status: progress.status,
          error: progress.error
        }, instance.id);
      })
    })]
  });
}
/* harmony default export */ const components_ProviderProgressList = (ProviderProgressList);
;// ./assets/src/components/ExportProgressModal/index.js
/**
 * Publish Progress Modal Component
 *
 * Shows export progress with progress bar and status messages
 *
 */










// Styles - extracted to module level for performance

const modalContentStyle = {
  padding: spacing['2xl'],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing['2xl']
};
const noticeErrorStyle = {
  ...noticeStyles.error,
  padding: spacing.md,
  marginBottom: spacing.md
};
const noticeSuccessStyle = {
  ...noticeStyles.success,
  padding: spacing.md,
  marginBottom: spacing.md
};
const noticeParagraphStyle = {
  margin: '0 0 0.5rem'
};
const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.xl,
  padding: spacing['2xl'],
  textAlign: 'center'
};
const loadingParagraphStyle = {
  margin: 0,
  fontSize: '1.125rem',
  color: colors.textMuted
};
function ExportProgressModal({
  isOpen,
  onClose,
  onComplete
}) {
  const exportState = useExportState();
  const {
    startExport
  } = useExportController(exportState);
  const {
    steps,
    isExporting,
    finalStatus,
    error,
    reset,
    providerProgress,
    providerInstances
  } = exportState;

  // Keep modal open if finalStatus is set, even if isOpen becomes false
  // This allows the auto-close effect to run and show the success message
  const shouldShowModal = isOpen || finalStatus;

  // Wrapper for onClose that resets state before closing
  // Only allow closing when job is finished (has finalStatus or error)
  const handleClose = (0,external_wp_element_namespaceObject.useCallback)(() => {
    // Prevent closing while job is in progress
    if (isExporting && !finalStatus && !error) {
      return;
    }
    reset();
    if (onClose) {
      onClose();
    }
  }, [reset, onClose, isExporting, finalStatus, error]);

  // Reset state when modal closes (only when shouldShowModal becomes false)
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!shouldShowModal) {
      reset();
    }
  }, [shouldShowModal, reset]);

  // Start export when modal opens
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isOpen && !isExporting) {
      // Only start if we haven't started yet (no steps initialized)
      if (steps.length === 0) {
        startExport();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to avoid re-triggering

  // Handle completion
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (finalStatus && onComplete) {
      // Call onComplete callback to refresh data
      // Note: Modal no longer auto-closes, user must manually close
      onComplete(finalStatus);
    }
  }, [finalStatus, onComplete]);
  if (!shouldShowModal) {
    return null;
  }
  const getModalTitle = () => {
    if (error) {
      return (0,external_wp_i18n_namespaceObject.__)('Publish Failed', 'aether-site-exporter');
    }
    if (finalStatus) {
      return (0,external_wp_i18n_namespaceObject.__)('Site Published Successfully!', 'aether-site-exporter');
    }
    return (0,external_wp_i18n_namespaceObject.__)('Exporting Site', 'aether-site-exporter');
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-export-progress-modal",
    title: getModalTitle(),
    onRequestClose: handleClose,
    isFullScreen: true,
    shouldCloseOnClickOutside: false,
    shouldCloseOnEsc: false,
    __experimentalHideHeader: false,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-export-progress-modal__content",
      style: modalContentStyle,
      children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-export-progress-modal__notice aether-export-progress-modal__notice--error",
        style: noticeErrorStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__notice-text",
          style: {
            margin: 0
          },
          children: error
        })
      }), finalStatus && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-export-progress-modal__notice aether-export-progress-modal__notice--success",
        style: noticeSuccessStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__notice-text",
          style: noticeParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Your site has been exported successfully!', 'aether')
        }), finalStatus.deploymentUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("p", {
          className: "aether-export-progress-modal__deployment",
          style: {
            margin: 0
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-export-progress-modal__deployment-label",
            children: (0,external_wp_i18n_namespaceObject.__)('View your published site:', 'aether')
          }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
            className: "aether-export-progress-modal__deployment-link",
            href: finalStatus.deploymentUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: finalStatus.deploymentUrl
          })]
        })]
      }), !error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_GlobalStepsProgress, {
        steps: steps
      }), !error && areGlobalStepsComplete(steps) && providerInstances.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderProgressList, {
        providerProgress: providerProgress,
        providerInstances: providerInstances
      }), steps.length === 0 && !error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-export-progress-modal__loading",
        style: loadingStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
          className: "aether-export-progress-modal__spinner"
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-export-progress-modal__loading-text",
          style: loadingParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Initializing export process…', 'aether-site-exporter')
        })]
      })]
    })
  });
}
;// ./assets/src/components/ErrorBoundary/index.js
/**
 * Error Boundary Component
 *
 * Catches errors in React component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 */





/**
 * Error Boundary component
 */

class ErrorBoundary extends external_wp_element_namespaceObject.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Error caught by ErrorBoundary:', {
      error,
      errorInfo
    });
    this.setState({
      error,
      errorInfo
    });

    // Optionally send to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError
        });
      }

      // Default fallback UI
      const containerStyle = {
        padding: spacing.lg
      };
      const noticeStyle = {
        ...noticeStyles.error,
        padding: spacing.md + ' ' + spacing.lg,
        margin: spacing.lg + ' 0'
      };
      const headingStyle = {
        margin: '0 0 ' + spacing.sm,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.text
      };
      const paragraphStyle = {
        margin: '0 0 ' + spacing.sm,
        color: colors.text
      };
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-error-boundary",
        style: containerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-error-boundary__notice",
          style: noticeStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
            className: "aether-error-boundary__heading",
            style: headingStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Something went wrong', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
            className: "aether-error-boundary__message",
            style: paragraphStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('An unexpected error occurred. Please try refreshing the page.', 'aether')
          }), this.state.error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("details", {
            className: "aether-error-boundary__details",
            style: {
              marginTop: spacing.lg
            },
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("summary", {
              className: "aether-error-boundary__summary",
              children: (0,external_wp_i18n_namespaceObject.__)('Error details', 'aether-site-exporter')
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("pre", {
              className: "aether-error-boundary__error-text",
              style: {
                marginTop: spacing.lg,
                padding: spacing.lg,
                background: colors.backgroundLighter,
                overflow: 'auto',
                fontSize: fontSize.sm
              },
              children: [this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack]
            })]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("button", {
            type: "button",
            className: "aether-error-boundary__retry-button",
            onClick: this.resetError,
            style: {
              marginTop: spacing.lg,
              padding: spacing.sm + ' ' + spacing.lg,
              background: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
              borderRadius: borderRadius.sm,
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.normal,
              lineHeight: 1.5
            },
            children: (0,external_wp_i18n_namespaceObject.__)('Try again', 'aether-site-exporter')
          })]
        })
      });
    }
    return this.props.children;
  }
}
/* harmony default export */ const components_ErrorBoundary = (ErrorBoundary);
;// ./assets/src/utils/errorHandler.js
/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors globally.
 *
 */

/**
 * Initialize global error handlers
 */
function initializeErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Prevent default browser behavior (console error)
    event.preventDefault();

    // Show user-friendly error notification
    showErrorNotification('An unexpected error occurred. Please try again or refresh the page.');
  });

  // Handle uncaught errors
  window.addEventListener('error', event => {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Don't prevent default for syntax errors - let them show in console
    if (event.error && event.error.stack) {
      event.preventDefault();
      showErrorNotification('An unexpected error occurred. Please refresh the page.');
    }
  });
}

/**
 * Show error notification to user
 *
 * @param {string} message Error message to display
 */
function showErrorNotification(message) {
  // Use WordPress notices if available
  if (window.wp && window.wp.data && window.wp.data.dispatch) {
    // Store dispatch result in a variable first to safely check it
    const noticesDispatch = window.wp.data.dispatch('core/notices');

    // Check if result is a valid object before destructuring
    if (noticesDispatch && typeof noticesDispatch === 'object') {
      const {
        createErrorNotice
      } = noticesDispatch;
      if (createErrorNotice && typeof createErrorNotice === 'function') {
        createErrorNotice(message, {
          id: 'aether-global-error',
          isDismissible: true
        });
        return;
      }
    }
  }

  // Fallback to console error
  console.error(message);
}
;// ./assets/src/export-modal/index.js
/**
 * Export Modal Entry Point
 *
 * Self-contained bundle with ExportProgressModal and all dependencies.
 * Loaded dynamically when admin bar export button is clicked.
 *
 */

// Set webpack publicPath before any imports
// Note: Webpack is configured to never create chunks - all code is bundled into single files
/* global __webpack_public_path__ */
/* eslint-disable camelcase */
if (true) {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.pluginUrl) {
    const pluginUrl = window.aetherData.pluginUrl;
    // Ensure plugin URL ends with slash
    const publicPath = pluginUrl.endsWith('/') ? pluginUrl + 'assets/build/' : pluginUrl + '/assets/build/';
    __webpack_require__.p = publicPath;
  }
}
/* eslint-enable camelcase */







// Initialize global error handlers

initializeErrorHandlers();

/**
 * Initialize export modal from admin bar
 *
 * @return {void}
 */
function initExportModal() {
  // Create or get root container
  let container = document.getElementById('aether-export-modal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'aether-export-modal-root';
    document.body.appendChild(container);
  }

  // Handle modal close
  const handleClose = () => {
    const containerEl = document.getElementById('aether-export-modal-root');
    if (containerEl) {
      (0,external_wp_element_namespaceObject.render)(null, containerEl);
    }
    // Reset loading flag after delay to allow modal to close
    setTimeout(() => {
      window.aetherExportLoaded = false;
    }, 300);
  };
  try {
    (0,external_wp_element_namespaceObject.render)(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ErrorBoundary, {
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportProvider, {
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ExportProgressModal, {
          isOpen: true,
          onClose: handleClose
        })
      })
    }), container);
  } catch (error) {
    // eslint-disable-line no-console
    console.error('Aether: Error rendering export modal:', error);
  }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExportModal);
} else {
  initExportModal();
}
/******/ })()
;