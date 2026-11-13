library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        data : in std_logic_vector(7 downto 0);
        received_parity : in std_logic;
        generated_parity : out std_logic;
        error : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    generated_parity <= xor data;
    error <= (xor data) xor received_parity;
end architecture;
