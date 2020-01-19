<template>
  <div>
  <v-text-field :autofocus="autofocus"
                :class="['v-tel', inputClasses]"
                :disabled="disabled"
                :id="inputId"
                :maxlength="maxLen"
                :name="name"
                :placeholder="parsedPlaceholder"
                :required="required"
                @blur="onBlur"
                @focus="onFocus"
                @input="onInput"
                @keyup.enter="onEnter"
                @keyup.space="onSpace"
                ref="input"
                type="tel"
                v-model="phone">
    <template v-slot:prepend-inner>
      <v-btn text tile @click.stop="countryDialog = true" >
        <div :class="activeCountry.iso2.toLowerCase()" class="v-tel__flag" v-if="enabledFlags"></div>
        <span class="country-code" v-if="enabledCountryCode">+{{ activeCountry.dialCode }}</span>
        <span class="dropdown-arrow">{{ countryDialog ? '▲' : '▼' }}</span>
      </v-btn>
    </template>

  </v-text-field>
  <v-dialog fullscreen hide-overlay scrollable transition="dialog-bottom-transition" v-model="countryDialog">
    <v-card tile>
      <v-toolbar color="primary" dark flat>
        <v-btn @click="isSearch? isSearch = false : countryDialog = false" dark icon>
          <v-icon>{{isSearch? 'mdi-chevron-left': 'mdi-close'}}</v-icon>
        </v-btn>
        <v-toolbar-title :class="{'title__search': isSearch}">
          <v-text-field :label="searchLabel" autofocus dark flat hide-details solo v-if="isSearch"
                        v-model="search"/>
          <template v-else>
            {{modalTitle}}
          </template>
        </v-toolbar-title>
        <v-spacer v-if="!isSearch"/>
        <v-btn @click="isSearch = true" dark icon
               v-if="!isSearch">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="px-0">
        <v-list>
          <v-list-item
            :key="pb.iso2 + (pb.preferred ? '-preferred' : '')"
            @click="choose(pb)"
            @mousemove="selectedIndex = index"
            v-for="(pb, index) in countryList"
          >
            <v-list-item-action v-if="enabledFlags">
              <div :class="pb.iso2.toLowerCase()" class="v-tel__flag"></div>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-text="pb.name"/>
            </v-list-item-content>
            <v-list-item-action v-if="dropdownOptions && !dropdownOptions.disabledDialCode">
              <span>+{{ pb.dialCode }}</span>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
  </div>
</template>

<script>
import PhoneNumber from 'awesome-phonenumber'
import utils, { getCountry, setCaretPosition } from '../utils'

function getDefault (key) {
  const value = utils.options[key]
  if (typeof value === 'undefined') {
    return utils.options[key]
  }
  return value
}

export default {
  name: 'VTel',
  props: {
    searchLabel: {
      type: String,
      default: () => getDefault('searchLabel')
    },
    modalTitle: {
      type: String,
      default: () => getDefault('modalTitle')
    },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: () => getDefault('placeholder')
    },
    disabledFetchingCountry: {
      type: Boolean,
      default: () => getDefault('disabledFetchingCountry')
    },
    disabled: {
      type: Boolean,
      default: () => getDefault('disabled')
    },
    mode: {
      type: String,
      default: () => getDefault('mode')
    },
    invalidMsg: {
      type: String,
      default: () => getDefault('invalidMsg')
    },
    required: {
      type: Boolean,
      default: () => getDefault('required')
    },
    allCountries: {
      type: Array,
      default: () => getDefault('allCountries')
    },
    defaultCountry: {
      // Default country code, ie: 'AU'
      // Will override the current country of user
      type: String,
      default: () => getDefault('defaultCountry')
    },
    enabledCountryCode: {
      type: Boolean,
      default: () => getDefault('enabledCountryCode')
    },
    enabledFlags: {
      type: Boolean,
      default: () => getDefault('enabledFlags')
    },
    preferredCountries: {
      type: Array,
      default: () => getDefault('preferredCountries')
    },
    onlyCountries: {
      type: Array,
      default: () => getDefault('onlyCountries')
    },
    ignoredCountries: {
      type: Array,
      default: () => getDefault('ignoredCountries')
    },
    autocomplete: {
      type: String,
      default: () => getDefault('autocomplete')
    },
    autofocus: {
      type: Boolean,
      default: () => getDefault('autofocus')
    },
    name: {
      type: String,
      default: () => getDefault('name')
    },
    wrapperClasses: {
      type: [String, Array, Object],
      default: () => getDefault('wrapperClasses')
    },
    inputClasses: {
      type: [String, Array, Object],
      default: () => getDefault('inputClasses')
    },
    inputId: {
      type: String,
      default: () => getDefault('inputId')
    },
    dropdownOptions: {
      type: Object,
      default: () => getDefault('dropdownOptions')
    },
    inputOptions: {
      type: Object,
      default: () => getDefault('inputOptions')
    },
    maxLen: {
      type: Number,
      default: () => getDefault('maxLen')
    },
    validCharactersOnly: {
      type: Boolean,
      default: () => getDefault('validCharactersOnly')
    },
    customValidate: {
      type: [Boolean, RegExp],
      default: () => getDefault('customValidate')
    },
    dynamicPlaceholder: {
      type: Boolean,
      default: () => getDefault('dynamicPlaceholder')
    }
  },
  data: () => ({
    phone: '',
    countryDialog: false,
    search: '',
    isSearch: false,
    activeCountry: { iso2: '' },
    finishMounted: false,
    selectedIndex: null,
    typeToFindInput: '',
    typeToFindTimer: null,
    cursorPosition: 0
  }),
  computed: {
    countryList () {
      return this.isSearch && this.search.length > 0 ? this.searchCountry : this.sortedCountries
    },
    searchCountry () {
      return this.sortedCountries.filter(item => {
        return item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1
      })
    },
    parsedPlaceholder () {
      if (!this.finishMounted) {
        return ''
      }
      if (this.dynamicPlaceholder) {
        const mode = this.mode || 'international'
        return PhoneNumber.getExample(this.activeCountry.iso2, 'mobile').getNumber(mode)
      }
      return this.placeholder
    },
    parsedMode () {
      if (this.customValidate) {
        return 'input'
      }
      if (this.mode) {
        if (!['international', 'national'].includes(this.mode)) {
          console.error('Invalid value of prop "mode"')
        } else {
          return this.mode
        }
      }
      if (!this.phone || this.phone[0] !== '+') {
        return 'national'
      }
      return 'international'
    },
    filteredCountries () {
      // List countries after filtered
      if (this.onlyCountries.length) {
        return this.getCountries(this.onlyCountries)
      }

      if (this.ignoredCountries.length) {
        return this.allCountries.filter(
          ({ iso2 }) => !this.ignoredCountries.includes(iso2.toUpperCase()) &&
              !this.ignoredCountries.includes(iso2.toLowerCase())
        )
      }

      return this.allCountries
    },
    sortedCountries () {
      // Sort the list countries: from preferred countries to all countries
      const preferredCountries = this.getCountries(this.preferredCountries)
        .map(country => ({ ...country, preferred: true }))

      return [...preferredCountries, ...this.filteredCountries]
    },
    phoneObject () {
      const result = PhoneNumber(this.phone, this.activeCountry.iso2).toJSON()
      Object.assign(result, {
        isValid: result.valid,
        country: this.activeCountry
      })
      return result
    },
    phoneText () {
      let key = 'input'
      if (this.phoneObject.valid) {
        key = this.parsedMode
      }
      return this.phoneObject.number[key] || ''
    }
  },
  watch: {
    'phoneObject.valid': function (value) {
      if (value) {
        this.phone = this.phoneText
      }
      this.$emit('validate', this.phoneObject)
      this.$emit('onValidate', this.phoneObject) // Deprecated
    },
    value () {
      this.phone = this.value
    },
    countryDialog (isDropdownOpened) {
      // Emit open and close events
      if (isDropdownOpened) {
        this.$emit('open')
      } else {
        this.$emit('close')
      }
    },
    phone (newValue, oldValue) {
      const isValidCharactersOnly = this.validCharactersOnly && !this.testCharacters()
      const isCustomValidate = this.customValidate && !this.testCustomValidate()
      if (isValidCharactersOnly || isCustomValidate) {
        this.$nextTick(() => {
          this.phone = oldValue
        })
      } else if (newValue) {
        if (newValue[0] === '+') {
          const code = PhoneNumber(newValue).getRegionCode()
          if (code) {
            this.activeCountry = this.findCountry(code) || this.activeCountry
          }
        }
      }
      // Reset the cursor to current position if it's not the last character.
      if (this.cursorPosition < oldValue.length) {
        this.$nextTick(() => {
          setCaretPosition(this.$refs.input.$el.querySelector('input'), this.cursorPosition)
        })
      }
    },
    isSearch (val) {
      if (!val) {
        this.search = ''
      }
    },
    activeCountry (value) {
      if (value && value.iso2) {
        this.$emit('country-changed', value)
      }
    }
  },
  mounted () {
    this.initializeCountry()
      .then(() => {
        if (!this.phone &&
            this.inputOptions &&
            this.inputOptions.showDialCode &&
            this.activeCountry.dialCode) {
          this.phone = `+${this.activeCountry.dialCode}`
        }
        this.$emit('validate', this.phoneObject)
        this.$emit('onValidate', this.phoneObject) // Deprecated
      })
      .catch(console.error)
      .finally(() => {
        this.finishMounted = true
      })
  },
  created () {
    if (this.value) {
      this.phone = this.value.trim()
    }
  },
  methods: {
    initializeCountry () {
      return new Promise((resolve) => {
        /**
           * 1. If the phone included prefix (+12), try to get the country and set it
           */
        if (this.phone && this.phone[0] === '+') {
          const activeCountry = PhoneNumber(this.phone).getRegionCode()
          if (activeCountry) {
            this.choose(activeCountry)
            resolve()
            return
          }
        }
        /**
           * 2. Use default country if passed from parent
           */
        if (this.defaultCountry) {
          const defaultCountry = this.findCountry(this.defaultCountry)
          if (defaultCountry) {
            this.choose(defaultCountry)
            resolve()
            return
          }
        }
        const fallbackCountry = this.findCountry(this.preferredCountries[0]) ||
            this.filteredCountries[0]
        /**
           * 3. Check if fetching country based on user's IP is allowed, set it as the default country
           */
        if (!this.disabledFetchingCountry) {
          getCountry()
            .then((res) => {
              this.activeCountry = this.findCountry(res) || this.activeCountry
            })
            .catch((error) => {
              console.warn(error)
              /**
                 * 4. Use the first country from preferred list (if available) or all countries list
                 */
              this.choose(fallbackCountry)
            })
            .finally(() => {
              resolve()
            })
        } else {
          /**
             * 4. Use the first country from preferred list (if available) or all countries list
             */
          this.choose(fallbackCountry)
          resolve()
        }
      })
    },
    /**
       * Get the list of countries from the list of iso2 code
       */
    getCountries (list = []) {
      return list
        .map(countryCode => this.findCountry(countryCode))
        .filter(Boolean)
    },
    findCountry (iso = '') {
      return this.allCountries.find(country => country.iso2 === iso.toUpperCase())
    },
    choose (country, toEmitInputEvent = false) {
      let parsedCountry = country
      if (typeof parsedCountry === 'string') {
        parsedCountry = this.findCountry(parsedCountry)
      }
      if (!parsedCountry) {
        return
      }
      this.activeCountry = parsedCountry || this.activeCountry || {}
      if (this.phone &&
          this.phone[0] === '+' &&
          this.activeCountry.iso2 &&
          this.phoneObject.number.national) {
        // Attach the current phone number with the newly selected country
        this.phone = PhoneNumber(this.phoneObject.number.national, this.activeCountry.iso2)
          .getNumber('international')
      } else if (this.inputOptions && this.inputOptions.showDialCode && parsedCountry) {
        // Reset phone if the showDialCode is set
        this.phone = `+${parsedCountry.dialCode}`
      }
      if (toEmitInputEvent) {
        this.$emit('input', this.phoneText, this.phoneObject)
        this.$emit('onInput', this.phoneObject) // Deprecated
      }
      this.countryDialog = false
      this.isSearch = false
      this.search = ''
    },
    testCharacters () {
      const re = /^[()\-+0-9\s]*$/
      return re.test(this.phone)
    },
    testCustomValidate () {
      return this.customValidate instanceof RegExp ? this.customValidate.test(this.phone) : false
    },
    onInput (e) {
      if (this.validCharactersOnly && !this.testCharacters()) {
        return
      }
      if (this.customValidate && !this.testCustomValidate()) {
        return
      }
      const input = this.$refs.input.$el.querySelector('input')
      input.setCustomValidity(this.phoneObject.valid ? '' : this.invalidMsg)
      // Returns response.number to assign it to v-model (if being used)
      // Returns full response for cases @input is used
      // and parent wants to return the whole response.
      this.$emit('input', this.phoneText, this.phoneObject)
      this.$emit('onInput', this.phoneObject) // Deprecated

      // Keep the current cursor position just in case the input reformatted
      // and it gets moved to the last character.

      this.cursorPosition = this.$refs.input.$el.querySelector('input').selectionStart
    },
    onBlur () {
      this.$emit('blur')
      this.$emit('onBlur') // Deprecated
    },
    onFocus () {
      this.$emit('focus')
    },
    onEnter () {
      this.$emit('enter')
      this.$emit('onEnter') // Deprecated
    },
    onSpace () {
      this.$emit('space')
      this.$emit('onSpace') // Deprecated
    },
    focus () {
      this.$refs.input.focus()
    }
  }
}
</script>

<style lang="scss">
  @import "../assets/sprite.css";

  .title__search {
    width: 100%;
    margin-left: 0 !important;
    padding-left: 0 !important;

    .v-text-field--solo > .v-input__control > .v-input__slot {
      background: transparent !important;

      input {
        caret-color: #fff;
      }
    }
  }
</style>
