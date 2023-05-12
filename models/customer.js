"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");
const { capitalizeWords } = require("../helpers")

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers, when not searching.
   * find customers with matching first and/or
   */

  static async all(fullSearch) {

    let results;
    let searchTermOne;
    let searchTermTwo;

    //When not using search bar
    if(!fullSearch){
      results = await db.query(
        `SELECT id,
                    first_name AS "firstName",
                    last_name  AS "lastName",
                    phone,
                    notes
             FROM customers
             ORDER BY last_name, first_name`,
      );
    }

    //when we recieve a search query
    else{
      fullSearch = capitalizeWords(fullSearch.split(" "))

      if(fullSearch.length > 1){
        searchTermOne = fullSearch[0];
        searchTermTwo = fullSearch[1];
      }
      else{
        searchTermOne = fullSearch[0];
      }

      results = await Customer.searchByName(searchTermOne, searchTermTwo)
    }


    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];
    //{ id, firstName, lastName, phone, notes }

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search by name */

  static async searchByName(searchTermOne, searchTermTwo) {
    let results;

    if(!searchTermTwo){
      results = await db.query(
        `SELECT id,
                    first_name AS "firstName",
                    last_name  AS "lastName"
             FROM customers
             WHERE first_name = $1 OR last_name = $1
             ORDER BY last_name, first_name`,
        [searchTermOne],
      );
    }
    //TODO: iLike statement in solutiom: [‘%${term}%"]
    else{
      results = await db.query(
        `SELECT id,
                    first_name AS "firstName",
                    last_name  AS "lastName"
             FROM customers
             WHERE first_name = $1 AND last_name = $2
             ORDER BY last_name, first_name`,
        [searchTermOne, searchTermTwo],
      );
    }

    return results;
  }

  /** gets list of top 10 customers w/ most reservations */

  static async getBestCustomers(){
    const results = await db.query(
      `SELECT customers.id, COUNT(*),
                    first_name AS "firstName",
                    last_name  AS "lastName"
             FROM customers
             JOIN reservations ON customers.id=customer_id
             GROUP BY customers.id
             ORDER BY count DESC;`
    )
      //TODO: Limit to 10 from database
    return results.rows.slice(0, 10).map(c=> new Customer(c));
  }

  /** return full name of customer */

  fullName() {
    const fullName = [this.firstName, this.lastName];
    return fullName.join(" ");
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;
