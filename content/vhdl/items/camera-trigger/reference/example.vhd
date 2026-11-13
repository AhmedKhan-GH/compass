library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        request : in std_logic;
        enabled : in std_logic;
        inhibit : in std_logic;
        capture : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    capture <= request and enabled and not inhibit;
end architecture;
